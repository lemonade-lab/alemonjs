import { translate } from "../../common/i18n.js";

//#region src/application/router/validator.ts
function getRequiredRule(arg) {
	return arg?.rules?.find((rule) => rule.required);
}
function getRestRule(arg) {
	return arg?.rules?.find((rule) => rule.type === "rest");
}
function getMinArgs(schema) {
	if (!schema) return 0;
	return (schema.args ?? []).filter((arg) => Boolean(getRequiredRule(arg))).length;
}
function getMaxArgs(schema) {
	if (!schema) return;
	const args = schema.args ?? [];
	if (args.some((arg) => Boolean(getRestRule(arg)))) return;
	return args.length > 0 ? args.length : void 0;
}
function getMissingRequiredArg(rawArgs, schema) {
	const args = schema?.args ?? [];
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (!getRequiredRule(arg)) continue;
		const rawValue = arg.rules?.some((rule) => rule.type === "rest") ? rawArgs.slice(index).join(" ").trim() : rawArgs[index];
		if (rawValue === void 0 || rawValue === "") return {
			arg,
			displayIndex: index + 1
		};
	}
	return null;
}
function parseRange(rawValue, rule) {
	const separator = (rule.separators ?? ["-", "－"]).find((item) => rawValue.includes(item));
	if (!separator) return null;
	const [rawStart = "", rawEnd = ""] = rawValue.split(separator).map((item) => item.trim());
	const start = Number(rawStart);
	const end = Number(rawEnd);
	if (!rawStart || !rawEnd || Number.isNaN(start) || Number.isNaN(end)) return null;
	return {
		start,
		end
	};
}
function formatArgReference(argName, displayIndex) {
	const name = String(argName ?? "").trim();
	if (name) return translate("arg.named", { name });
	return translate("arg.indexed", { index: displayIndex });
}
function validateTypedRule(rawValue, rule, context, usage) {
	const messagePrefix = formatArgReference(context.argName, context.displayIndex);
	const normalizedValue = rule.normalizeMap?.[rawValue] ?? rawValue;
	if (rule.pattern) {
		rule.pattern.lastIndex = 0;
		if (!rule.pattern.test(normalizedValue)) return {
			valid: false,
			error: rule.message ?? translate("validation.pattern", { arg: messagePrefix }),
			usage
		};
	}
	if (!rule.type || rule.type === "string") {
		const value = String(normalizedValue);
		if (rule.validator) {
			const customError = rule.validator(value, {
				...context,
				rawValue: normalizedValue
			});
			if (customError) return {
				valid: false,
				error: customError,
				usage
			};
		}
		return {
			valid: true,
			parsedArgs: [value]
		};
	}
	if (rule.type === "number") {
		const value = Number(normalizedValue);
		if (Number.isNaN(value)) return {
			valid: false,
			error: rule.message ?? translate("validation.number", { arg: messagePrefix }),
			usage
		};
		if (typeof rule.min === "number" && value < rule.min) return {
			valid: false,
			error: rule.message ?? translate("validation.min", {
				arg: messagePrefix,
				min: rule.min
			}),
			usage
		};
		if (typeof rule.max === "number" && value > rule.max) return {
			valid: false,
			error: rule.message ?? translate("validation.max", {
				arg: messagePrefix,
				max: rule.max
			}),
			usage
		};
		if (rule.validator) {
			const customError = rule.validator(value, {
				...context,
				rawValue: normalizedValue
			});
			if (customError) return {
				valid: false,
				error: customError,
				usage
			};
		}
		return {
			valid: true,
			parsedArgs: [value]
		};
	}
	if (rule.type === "enum") {
		const enumValues = rule.enum ?? [];
		if (!enumValues.includes(normalizedValue)) return {
			valid: false,
			error: rule.message ?? translate("validation.enum", {
				arg: messagePrefix,
				values: enumValues.join(" / ")
			}),
			usage
		};
		if (rule.validator) {
			const customError = rule.validator(normalizedValue, {
				...context,
				rawValue: normalizedValue
			});
			if (customError) return {
				valid: false,
				error: customError,
				usage
			};
		}
		return {
			valid: true,
			parsedArgs: [normalizedValue]
		};
	}
	if (rule.type === "range") {
		const value = parseRange(normalizedValue, rule);
		if (!value) return {
			valid: false,
			error: rule.message ?? translate("validation.range", { arg: messagePrefix }),
			usage
		};
		if (value.start > value.end) return {
			valid: false,
			error: rule.message ?? translate("validation.rangeOrder", { arg: messagePrefix }),
			usage
		};
		if (typeof rule.min === "number" && (value.start < rule.min || value.end < rule.min)) return {
			valid: false,
			error: rule.message ?? translate("validation.min", {
				arg: messagePrefix,
				min: rule.min
			}),
			usage
		};
		if (typeof rule.max === "number" && (value.start > rule.max || value.end > rule.max)) return {
			valid: false,
			error: rule.message ?? translate("validation.max", {
				arg: messagePrefix,
				max: rule.max
			}),
			usage
		};
		if (rule.validator) {
			const customError = rule.validator(value, {
				...context,
				rawValue: normalizedValue
			});
			if (customError) return {
				valid: false,
				error: customError,
				usage
			};
		}
		return {
			valid: true,
			parsedArgs: [value]
		};
	}
	if (rule.type === "rest") {
		const value = String(normalizedValue);
		if (rule.validator) {
			const customError = rule.validator(value, {
				...context,
				rawValue: normalizedValue
			});
			if (customError) return {
				valid: false,
				error: customError,
				usage
			};
		}
		return {
			valid: true,
			parsedArgs: [value]
		};
	}
	return {
		valid: true,
		parsedArgs: [String(normalizedValue)]
	};
}
function validateArgValue(commandPath, arg, rawValue, rawArgs, parsedArgs, argIndex, displayIndex, usage) {
	const rules = arg.rules ?? [];
	const context = {
		commandPath,
		argName: arg.name,
		argIndex,
		displayIndex,
		rawArgs,
		parsedArgs,
		rawValue
	};
	for (const rule of rules) {
		const result = validateTypedRule(rawValue, rule, context, usage);
		if (!result.valid) return result;
		if (rule.type) return result;
	}
	return {
		valid: true,
		parsedArgs: [rawValue]
	};
}
function validateRouteArgs(rawArgs, schema) {
	return validateRouteArgsForCommand(void 0, rawArgs, schema);
}
function validateRouteArgsForCommand(commandPath, rawArgs, schema) {
	const minArgs = getMinArgs(schema);
	const maxArgs = getMaxArgs(schema);
	const usage = schema?.usage;
	if (rawArgs.length < minArgs) {
		const missingRequiredArg = getMissingRequiredArg(rawArgs, schema);
		return {
			valid: false,
			error: schema?.messages?.tooFewArgs ?? (missingRequiredArg ? translate("validation.required", { arg: formatArgReference(missingRequiredArg.arg.name, missingRequiredArg.displayIndex) }) : translate("validation.tooFew", { count: minArgs })),
			usage
		};
	}
	if (typeof maxArgs === "number" && rawArgs.length > maxArgs) return {
		valid: false,
		error: schema?.messages?.tooManyArgs ?? translate("validation.tooMany", { count: maxArgs }),
		usage
	};
	const args = schema?.args ?? [];
	const parsedArgs = [];
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		const displayIndex = index + 1;
		const restRule = getRestRule(arg);
		if (restRule) {
			const rawValue = rawArgs.slice(index).join(" ").trim();
			const requiredRule = getRequiredRule(arg);
			if (!rawValue) {
				if (requiredRule) return {
					valid: false,
					error: requiredRule.message ?? translate("validation.required", { arg: formatArgReference(arg.name, displayIndex) }),
					usage
				};
				if (arg.defaultValue !== void 0) parsedArgs.push(arg.defaultValue);
				continue;
			}
			const result = validateTypedRule(rawValue, restRule, {
				commandPath,
				argName: arg.name,
				argIndex: index,
				displayIndex,
				rawArgs,
				parsedArgs,
				rawValue
			}, usage);
			if (!result.valid) return result;
			parsedArgs.push(...result.parsedArgs);
			break;
		}
		const rawValue = rawArgs[index];
		if (rawValue === void 0) {
			const requiredRule = getRequiredRule(arg);
			if (requiredRule) return {
				valid: false,
				error: requiredRule.message ?? translate("validation.required", { arg: formatArgReference(arg.name, displayIndex) }),
				usage
			};
			if (arg.defaultValue !== void 0) parsedArgs.push(arg.defaultValue);
			continue;
		}
		const result = validateArgValue(commandPath, arg, rawValue, rawArgs, parsedArgs, index, displayIndex, usage);
		if (!result.valid) return result;
		parsedArgs.push(...result.parsedArgs);
	}
	return {
		valid: true,
		parsedArgs
	};
}

//#endregion
export { validateRouteArgs, validateRouteArgsForCommand };