function Kv(e, t) {
  for (var n = 0; n < t.length; n++) {
    const l = t[n]
    if (typeof l != 'string' && !Array.isArray(l)) {
      for (const u in l)
        if (u !== 'default' && !(u in e)) {
          const a = Object.getOwnPropertyDescriptor(l, u)
          a && Object.defineProperty(e, u, a.get ? a : { enumerable: !0, get: () => l[u] })
        }
    }
  }
  return Object.freeze(Object.defineProperty(e, Symbol.toStringTag, { value: 'Module' }))
}
;(function () {
  const t = document.createElement('link').relList
  if (t && t.supports && t.supports('modulepreload')) return
  for (const u of document.querySelectorAll('link[rel="modulepreload"]')) l(u)
  new MutationObserver(u => {
    for (const a of u)
      if (a.type === 'childList')
        for (const i of a.addedNodes) i.tagName === 'LINK' && i.rel === 'modulepreload' && l(i)
  }).observe(document, { childList: !0, subtree: !0 })
  function n(u) {
    const a = {}
    return (
      u.integrity && (a.integrity = u.integrity),
      u.referrerPolicy && (a.referrerPolicy = u.referrerPolicy),
      u.crossOrigin === 'use-credentials'
        ? (a.credentials = 'include')
        : u.crossOrigin === 'anonymous'
        ? (a.credentials = 'omit')
        : (a.credentials = 'same-origin'),
      a
    )
  }
  function l(u) {
    if (u.ep) return
    u.ep = !0
    const a = n(u)
    fetch(u.href, a)
  }
})()
function Jv(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e
}
var wd = { exports: {} },
  Bi = {}
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Wv = Symbol.for('react.transitional.element'),
  Pv = Symbol.for('react.fragment')
function Ad(e, t, n) {
  var l = null
  if ((n !== void 0 && (l = '' + n), t.key !== void 0 && (l = '' + t.key), 'key' in t)) {
    n = {}
    for (var u in t) u !== 'key' && (n[u] = t[u])
  } else n = t
  return (t = n.ref), { $$typeof: Wv, type: e, key: l, ref: t !== void 0 ? t : null, props: n }
}
Bi.Fragment = Pv
Bi.jsx = Ad
Bi.jsxs = Ad
wd.exports = Bi
var w = wd.exports,
  Rd = { exports: {} },
  $i = {},
  Md = { exports: {} },
  Dd = {}
/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ ;(function (e) {
  function t(R, H) {
    var C = R.length
    R.push(H)
    e: for (; 0 < C; ) {
      var L = (C - 1) >>> 1,
        q = R[L]
      if (0 < u(q, H)) (R[L] = H), (R[C] = q), (C = L)
      else break e
    }
  }
  function n(R) {
    return R.length === 0 ? null : R[0]
  }
  function l(R) {
    if (R.length === 0) return null
    var H = R[0],
      C = R.pop()
    if (C !== H) {
      R[0] = C
      e: for (var L = 0, q = R.length, X = q >>> 1; L < X; ) {
        var Ee = 2 * (L + 1) - 1,
          U = R[Ee],
          I = Ee + 1,
          Se = R[I]
        if (0 > u(U, C))
          I < q && 0 > u(Se, U)
            ? ((R[L] = Se), (R[I] = C), (L = I))
            : ((R[L] = U), (R[Ee] = C), (L = Ee))
        else if (I < q && 0 > u(Se, C)) (R[L] = Se), (R[I] = C), (L = I)
        else break e
      }
    }
    return H
  }
  function u(R, H) {
    var C = R.sortIndex - H.sortIndex
    return C !== 0 ? C : R.id - H.id
  }
  if (
    ((e.unstable_now = void 0),
    typeof performance == 'object' && typeof performance.now == 'function')
  ) {
    var a = performance
    e.unstable_now = function () {
      return a.now()
    }
  } else {
    var i = Date,
      r = i.now()
    e.unstable_now = function () {
      return i.now() - r
    }
  }
  var c = [],
    f = [],
    o = 1,
    g = null,
    m = 3,
    s = !1,
    y = !1,
    E = !1,
    x = typeof setTimeout == 'function' ? setTimeout : null,
    v = typeof clearTimeout == 'function' ? clearTimeout : null,
    h = typeof setImmediate < 'u' ? setImmediate : null
  function p(R) {
    for (var H = n(f); H !== null; ) {
      if (H.callback === null) l(f)
      else if (H.startTime <= R) l(f), (H.sortIndex = H.expirationTime), t(c, H)
      else break
      H = n(f)
    }
  }
  function b(R) {
    if (((E = !1), p(R), !y))
      if (n(c) !== null) (y = !0), V()
      else {
        var H = n(f)
        H !== null && ae(b, H.startTime - R)
      }
  }
  var S = !1,
    A = -1,
    O = 5,
    M = -1
  function z() {
    return !(e.unstable_now() - M < O)
  }
  function _() {
    if (S) {
      var R = e.unstable_now()
      M = R
      var H = !0
      try {
        e: {
          ;(y = !1), E && ((E = !1), v(A), (A = -1)), (s = !0)
          var C = m
          try {
            t: {
              for (p(R), g = n(c); g !== null && !(g.expirationTime > R && z()); ) {
                var L = g.callback
                if (typeof L == 'function') {
                  ;(g.callback = null), (m = g.priorityLevel)
                  var q = L(g.expirationTime <= R)
                  if (((R = e.unstable_now()), typeof q == 'function')) {
                    ;(g.callback = q), p(R), (H = !0)
                    break t
                  }
                  g === n(c) && l(c), p(R)
                } else l(c)
                g = n(c)
              }
              if (g !== null) H = !0
              else {
                var X = n(f)
                X !== null && ae(b, X.startTime - R), (H = !1)
              }
            }
            break e
          } finally {
            ;(g = null), (m = C), (s = !1)
          }
          H = void 0
        }
      } finally {
        H ? D() : (S = !1)
      }
    }
  }
  var D
  if (typeof h == 'function')
    D = function () {
      h(_)
    }
  else if (typeof MessageChannel < 'u') {
    var k = new MessageChannel(),
      K = k.port2
    ;(k.port1.onmessage = _),
      (D = function () {
        K.postMessage(null)
      })
  } else
    D = function () {
      x(_, 0)
    }
  function V() {
    S || ((S = !0), D())
  }
  function ae(R, H) {
    A = x(function () {
      R(e.unstable_now())
    }, H)
  }
  ;(e.unstable_IdlePriority = 5),
    (e.unstable_ImmediatePriority = 1),
    (e.unstable_LowPriority = 4),
    (e.unstable_NormalPriority = 3),
    (e.unstable_Profiling = null),
    (e.unstable_UserBlockingPriority = 2),
    (e.unstable_cancelCallback = function (R) {
      R.callback = null
    }),
    (e.unstable_continueExecution = function () {
      y || s || ((y = !0), V())
    }),
    (e.unstable_forceFrameRate = function (R) {
      0 > R || 125 < R || (O = 0 < R ? Math.floor(1e3 / R) : 5)
    }),
    (e.unstable_getCurrentPriorityLevel = function () {
      return m
    }),
    (e.unstable_getFirstCallbackNode = function () {
      return n(c)
    }),
    (e.unstable_next = function (R) {
      switch (m) {
        case 1:
        case 2:
        case 3:
          var H = 3
          break
        default:
          H = m
      }
      var C = m
      m = H
      try {
        return R()
      } finally {
        m = C
      }
    }),
    (e.unstable_pauseExecution = function () {}),
    (e.unstable_requestPaint = function () {}),
    (e.unstable_runWithPriority = function (R, H) {
      switch (R) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break
        default:
          R = 3
      }
      var C = m
      m = R
      try {
        return H()
      } finally {
        m = C
      }
    }),
    (e.unstable_scheduleCallback = function (R, H, C) {
      var L = e.unstable_now()
      switch (
        (typeof C == 'object' && C !== null
          ? ((C = C.delay), (C = typeof C == 'number' && 0 < C ? L + C : L))
          : (C = L),
        R)
      ) {
        case 1:
          var q = -1
          break
        case 2:
          q = 250
          break
        case 5:
          q = 1073741823
          break
        case 4:
          q = 1e4
          break
        default:
          q = 5e3
      }
      return (
        (q = C + q),
        (R = {
          id: o++,
          callback: H,
          priorityLevel: R,
          startTime: C,
          expirationTime: q,
          sortIndex: -1
        }),
        C > L
          ? ((R.sortIndex = C),
            t(f, R),
            n(c) === null && R === n(f) && (E ? (v(A), (A = -1)) : (E = !0), ae(b, C - L)))
          : ((R.sortIndex = q), t(c, R), y || s || ((y = !0), V())),
        R
      )
    }),
    (e.unstable_shouldYield = z),
    (e.unstable_wrapCallback = function (R) {
      var H = m
      return function () {
        var C = m
        m = H
        try {
          return R.apply(this, arguments)
        } finally {
          m = C
        }
      }
    })
})(Dd)
Md.exports = Dd
var Iv = Md.exports,
  _d = { exports: {} },
  $ = {}
/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var gf = Symbol.for('react.transitional.element'),
  ep = Symbol.for('react.portal'),
  tp = Symbol.for('react.fragment'),
  np = Symbol.for('react.strict_mode'),
  lp = Symbol.for('react.profiler'),
  up = Symbol.for('react.consumer'),
  ap = Symbol.for('react.context'),
  ip = Symbol.for('react.forward_ref'),
  rp = Symbol.for('react.suspense'),
  cp = Symbol.for('react.memo'),
  Cd = Symbol.for('react.lazy'),
  Do = Symbol.iterator
function fp(e) {
  return e === null || typeof e != 'object'
    ? null
    : ((e = (Do && e[Do]) || e['@@iterator']), typeof e == 'function' ? e : null)
}
var Nd = {
    isMounted: function () {
      return !1
    },
    enqueueForceUpdate: function () {},
    enqueueReplaceState: function () {},
    enqueueSetState: function () {}
  },
  zd = Object.assign,
  Hd = {}
function Il(e, t, n) {
  ;(this.props = e), (this.context = t), (this.refs = Hd), (this.updater = n || Nd)
}
Il.prototype.isReactComponent = {}
Il.prototype.setState = function (e, t) {
  if (typeof e != 'object' && typeof e != 'function' && e != null)
    throw Error(
      'takes an object of state variables to update or a function which returns an object of state variables.'
    )
  this.updater.enqueueSetState(this, e, t, 'setState')
}
Il.prototype.forceUpdate = function (e) {
  this.updater.enqueueForceUpdate(this, e, 'forceUpdate')
}
function Ld() {}
Ld.prototype = Il.prototype
function vf(e, t, n) {
  ;(this.props = e), (this.context = t), (this.refs = Hd), (this.updater = n || Nd)
}
var pf = (vf.prototype = new Ld())
pf.constructor = vf
zd(pf, Il.prototype)
pf.isPureReactComponent = !0
var _o = Array.isArray,
  fe = { H: null, A: null, T: null, S: null },
  Ud = Object.prototype.hasOwnProperty
function yf(e, t, n, l, u, a) {
  return (n = a.ref), { $$typeof: gf, type: e, key: t, ref: n !== void 0 ? n : null, props: a }
}
function op(e, t) {
  return yf(e.type, t, void 0, void 0, void 0, e.props)
}
function bf(e) {
  return typeof e == 'object' && e !== null && e.$$typeof === gf
}
function sp(e) {
  var t = { '=': '=0', ':': '=2' }
  return (
    '$' +
    e.replace(/[=:]/g, function (n) {
      return t[n]
    })
  )
}
var Co = /\/+/g
function pr(e, t) {
  return typeof e == 'object' && e !== null && e.key != null ? sp('' + e.key) : t.toString(36)
}
function No() {}
function dp(e) {
  switch (e.status) {
    case 'fulfilled':
      return e.value
    case 'rejected':
      throw e.reason
    default:
      switch (
        (typeof e.status == 'string'
          ? e.then(No, No)
          : ((e.status = 'pending'),
            e.then(
              function (t) {
                e.status === 'pending' && ((e.status = 'fulfilled'), (e.value = t))
              },
              function (t) {
                e.status === 'pending' && ((e.status = 'rejected'), (e.reason = t))
              }
            )),
        e.status)
      ) {
        case 'fulfilled':
          return e.value
        case 'rejected':
          throw e.reason
      }
  }
  throw e
}
function vl(e, t, n, l, u) {
  var a = typeof e
  ;(a === 'undefined' || a === 'boolean') && (e = null)
  var i = !1
  if (e === null) i = !0
  else
    switch (a) {
      case 'bigint':
      case 'string':
      case 'number':
        i = !0
        break
      case 'object':
        switch (e.$$typeof) {
          case gf:
          case ep:
            i = !0
            break
          case Cd:
            return (i = e._init), vl(i(e._payload), t, n, l, u)
        }
    }
  if (i)
    return (
      (u = u(e)),
      (i = l === '' ? '.' + pr(e, 0) : l),
      _o(u)
        ? ((n = ''),
          i != null && (n = i.replace(Co, '$&/') + '/'),
          vl(u, t, n, '', function (f) {
            return f
          }))
        : u != null &&
          (bf(u) &&
            (u = op(
              u,
              n +
                (u.key == null || (e && e.key === u.key)
                  ? ''
                  : ('' + u.key).replace(Co, '$&/') + '/') +
                i
            )),
          t.push(u)),
      1
    )
  i = 0
  var r = l === '' ? '.' : l + ':'
  if (_o(e))
    for (var c = 0; c < e.length; c++) (l = e[c]), (a = r + pr(l, c)), (i += vl(l, t, n, a, u))
  else if (((c = fp(e)), typeof c == 'function'))
    for (e = c.call(e), c = 0; !(l = e.next()).done; )
      (l = l.value), (a = r + pr(l, c++)), (i += vl(l, t, n, a, u))
  else if (a === 'object') {
    if (typeof e.then == 'function') return vl(dp(e), t, n, l, u)
    throw (
      ((t = String(e)),
      Error(
        'Objects are not valid as a React child (found: ' +
          (t === '[object Object]' ? 'object with keys {' + Object.keys(e).join(', ') + '}' : t) +
          '). If you meant to render a collection of children, use an array instead.'
      ))
    )
  }
  return i
}
function Ma(e, t, n) {
  if (e == null) return e
  var l = [],
    u = 0
  return (
    vl(e, l, '', '', function (a) {
      return t.call(n, a, u++)
    }),
    l
  )
}
function mp(e) {
  if (e._status === -1) {
    var t = e._result
    ;(t = t()),
      t.then(
        function (n) {
          ;(e._status === 0 || e._status === -1) && ((e._status = 1), (e._result = n))
        },
        function (n) {
          ;(e._status === 0 || e._status === -1) && ((e._status = 2), (e._result = n))
        }
      ),
      e._status === -1 && ((e._status = 0), (e._result = t))
  }
  if (e._status === 1) return e._result.default
  throw e._result
}
var zo =
  typeof reportError == 'function'
    ? reportError
    : function (e) {
        if (typeof window == 'object' && typeof window.ErrorEvent == 'function') {
          var t = new window.ErrorEvent('error', {
            bubbles: !0,
            cancelable: !0,
            message:
              typeof e == 'object' && e !== null && typeof e.message == 'string'
                ? String(e.message)
                : String(e),
            error: e
          })
          if (!window.dispatchEvent(t)) return
        } else if (typeof process == 'object' && typeof process.emit == 'function') {
          process.emit('uncaughtException', e)
          return
        }
      }
function hp() {}
$.Children = {
  map: Ma,
  forEach: function (e, t, n) {
    Ma(
      e,
      function () {
        t.apply(this, arguments)
      },
      n
    )
  },
  count: function (e) {
    var t = 0
    return (
      Ma(e, function () {
        t++
      }),
      t
    )
  },
  toArray: function (e) {
    return (
      Ma(e, function (t) {
        return t
      }) || []
    )
  },
  only: function (e) {
    if (!bf(e)) throw Error('React.Children.only expected to receive a single React element child.')
    return e
  }
}
$.Component = Il
$.Fragment = tp
$.Profiler = lp
$.PureComponent = vf
$.StrictMode = np
$.Suspense = rp
$.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = fe
$.act = function () {
  throw Error('act(...) is not supported in production builds of React.')
}
$.cache = function (e) {
  return function () {
    return e.apply(null, arguments)
  }
}
$.cloneElement = function (e, t, n) {
  if (e == null) throw Error('The argument must be a React element, but you passed ' + e + '.')
  var l = zd({}, e.props),
    u = e.key,
    a = void 0
  if (t != null)
    for (i in (t.ref !== void 0 && (a = void 0), t.key !== void 0 && (u = '' + t.key), t))
      !Ud.call(t, i) ||
        i === 'key' ||
        i === '__self' ||
        i === '__source' ||
        (i === 'ref' && t.ref === void 0) ||
        (l[i] = t[i])
  var i = arguments.length - 2
  if (i === 1) l.children = n
  else if (1 < i) {
    for (var r = Array(i), c = 0; c < i; c++) r[c] = arguments[c + 2]
    l.children = r
  }
  return yf(e.type, u, void 0, void 0, a, l)
}
$.createContext = function (e) {
  return (
    (e = {
      $$typeof: ap,
      _currentValue: e,
      _currentValue2: e,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }),
    (e.Provider = e),
    (e.Consumer = { $$typeof: up, _context: e }),
    e
  )
}
$.createElement = function (e, t, n) {
  var l,
    u = {},
    a = null
  if (t != null)
    for (l in (t.key !== void 0 && (a = '' + t.key), t))
      Ud.call(t, l) && l !== 'key' && l !== '__self' && l !== '__source' && (u[l] = t[l])
  var i = arguments.length - 2
  if (i === 1) u.children = n
  else if (1 < i) {
    for (var r = Array(i), c = 0; c < i; c++) r[c] = arguments[c + 2]
    u.children = r
  }
  if (e && e.defaultProps) for (l in ((i = e.defaultProps), i)) u[l] === void 0 && (u[l] = i[l])
  return yf(e, a, void 0, void 0, null, u)
}
$.createRef = function () {
  return { current: null }
}
$.forwardRef = function (e) {
  return { $$typeof: ip, render: e }
}
$.isValidElement = bf
$.lazy = function (e) {
  return { $$typeof: Cd, _payload: { _status: -1, _result: e }, _init: mp }
}
$.memo = function (e, t) {
  return { $$typeof: cp, type: e, compare: t === void 0 ? null : t }
}
$.startTransition = function (e) {
  var t = fe.T,
    n = {}
  fe.T = n
  try {
    var l = e(),
      u = fe.S
    u !== null && u(n, l),
      typeof l == 'object' && l !== null && typeof l.then == 'function' && l.then(hp, zo)
  } catch (a) {
    zo(a)
  } finally {
    fe.T = t
  }
}
$.unstable_useCacheRefresh = function () {
  return fe.H.useCacheRefresh()
}
$.use = function (e) {
  return fe.H.use(e)
}
$.useActionState = function (e, t, n) {
  return fe.H.useActionState(e, t, n)
}
$.useCallback = function (e, t) {
  return fe.H.useCallback(e, t)
}
$.useContext = function (e) {
  return fe.H.useContext(e)
}
$.useDebugValue = function () {}
$.useDeferredValue = function (e, t) {
  return fe.H.useDeferredValue(e, t)
}
$.useEffect = function (e, t) {
  return fe.H.useEffect(e, t)
}
$.useId = function () {
  return fe.H.useId()
}
$.useImperativeHandle = function (e, t, n) {
  return fe.H.useImperativeHandle(e, t, n)
}
$.useInsertionEffect = function (e, t) {
  return fe.H.useInsertionEffect(e, t)
}
$.useLayoutEffect = function (e, t) {
  return fe.H.useLayoutEffect(e, t)
}
$.useMemo = function (e, t) {
  return fe.H.useMemo(e, t)
}
$.useOptimistic = function (e, t) {
  return fe.H.useOptimistic(e, t)
}
$.useReducer = function (e, t, n) {
  return fe.H.useReducer(e, t, n)
}
$.useRef = function (e) {
  return fe.H.useRef(e)
}
$.useState = function (e) {
  return fe.H.useState(e)
}
$.useSyncExternalStore = function (e, t, n) {
  return fe.H.useSyncExternalStore(e, t, n)
}
$.useTransition = function () {
  return fe.H.useTransition()
}
$.version = '19.0.0'
_d.exports = $
var d = _d.exports
const N = Jv(d),
  cc = Kv({ __proto__: null, default: N }, [d])
var jd = { exports: {} },
  Qe = {}
/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var gp = d
function qd(e) {
  var t = 'https://react.dev/errors/' + e
  if (1 < arguments.length) {
    t += '?args[]=' + encodeURIComponent(arguments[1])
    for (var n = 2; n < arguments.length; n++) t += '&args[]=' + encodeURIComponent(arguments[n])
  }
  return (
    'Minified React error #' +
    e +
    '; visit ' +
    t +
    ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
  )
}
function nn() {}
var $e = {
    d: {
      f: nn,
      r: function () {
        throw Error(qd(522))
      },
      D: nn,
      C: nn,
      L: nn,
      m: nn,
      X: nn,
      S: nn,
      M: nn
    },
    p: 0,
    findDOMNode: null
  },
  vp = Symbol.for('react.portal')
function pp(e, t, n) {
  var l = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null
  return {
    $$typeof: vp,
    key: l == null ? null : '' + l,
    children: e,
    containerInfo: t,
    implementation: n
  }
}
var Ru = gp.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
function Yi(e, t) {
  if (e === 'font') return ''
  if (typeof t == 'string') return t === 'use-credentials' ? t : ''
}
Qe.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = $e
Qe.createPortal = function (e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null
  if (!t || (t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11)) throw Error(qd(299))
  return pp(e, t, null, n)
}
Qe.flushSync = function (e) {
  var t = Ru.T,
    n = $e.p
  try {
    if (((Ru.T = null), ($e.p = 2), e)) return e()
  } finally {
    ;(Ru.T = t), ($e.p = n), $e.d.f()
  }
}
Qe.preconnect = function (e, t) {
  typeof e == 'string' &&
    (t
      ? ((t = t.crossOrigin),
        (t = typeof t == 'string' ? (t === 'use-credentials' ? t : '') : void 0))
      : (t = null),
    $e.d.C(e, t))
}
Qe.prefetchDNS = function (e) {
  typeof e == 'string' && $e.d.D(e)
}
Qe.preinit = function (e, t) {
  if (typeof e == 'string' && t && typeof t.as == 'string') {
    var n = t.as,
      l = Yi(n, t.crossOrigin),
      u = typeof t.integrity == 'string' ? t.integrity : void 0,
      a = typeof t.fetchPriority == 'string' ? t.fetchPriority : void 0
    n === 'style'
      ? $e.d.S(e, typeof t.precedence == 'string' ? t.precedence : void 0, {
          crossOrigin: l,
          integrity: u,
          fetchPriority: a
        })
      : n === 'script' &&
        $e.d.X(e, {
          crossOrigin: l,
          integrity: u,
          fetchPriority: a,
          nonce: typeof t.nonce == 'string' ? t.nonce : void 0
        })
  }
}
Qe.preinitModule = function (e, t) {
  if (typeof e == 'string')
    if (typeof t == 'object' && t !== null) {
      if (t.as == null || t.as === 'script') {
        var n = Yi(t.as, t.crossOrigin)
        $e.d.M(e, {
          crossOrigin: n,
          integrity: typeof t.integrity == 'string' ? t.integrity : void 0,
          nonce: typeof t.nonce == 'string' ? t.nonce : void 0
        })
      }
    } else t == null && $e.d.M(e)
}
Qe.preload = function (e, t) {
  if (typeof e == 'string' && typeof t == 'object' && t !== null && typeof t.as == 'string') {
    var n = t.as,
      l = Yi(n, t.crossOrigin)
    $e.d.L(e, n, {
      crossOrigin: l,
      integrity: typeof t.integrity == 'string' ? t.integrity : void 0,
      nonce: typeof t.nonce == 'string' ? t.nonce : void 0,
      type: typeof t.type == 'string' ? t.type : void 0,
      fetchPriority: typeof t.fetchPriority == 'string' ? t.fetchPriority : void 0,
      referrerPolicy: typeof t.referrerPolicy == 'string' ? t.referrerPolicy : void 0,
      imageSrcSet: typeof t.imageSrcSet == 'string' ? t.imageSrcSet : void 0,
      imageSizes: typeof t.imageSizes == 'string' ? t.imageSizes : void 0,
      media: typeof t.media == 'string' ? t.media : void 0
    })
  }
}
Qe.preloadModule = function (e, t) {
  if (typeof e == 'string')
    if (t) {
      var n = Yi(t.as, t.crossOrigin)
      $e.d.m(e, {
        as: typeof t.as == 'string' && t.as !== 'script' ? t.as : void 0,
        crossOrigin: n,
        integrity: typeof t.integrity == 'string' ? t.integrity : void 0
      })
    } else $e.d.m(e)
}
Qe.requestFormReset = function (e) {
  $e.d.r(e)
}
Qe.unstable_batchedUpdates = function (e, t) {
  return e(t)
}
Qe.useFormState = function (e, t, n) {
  return Ru.H.useFormState(e, t, n)
}
Qe.useFormStatus = function () {
  return Ru.H.useHostTransitionStatus()
}
Qe.version = '19.0.0'
function Bd() {
  if (
    !(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
    )
  )
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(Bd)
    } catch {}
}
Bd(), (jd.exports = Qe)
var Ze = jd.exports
/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var we = Iv,
  $d = d,
  yp = Ze
function T(e) {
  var t = 'https://react.dev/errors/' + e
  if (1 < arguments.length) {
    t += '?args[]=' + encodeURIComponent(arguments[1])
    for (var n = 2; n < arguments.length; n++) t += '&args[]=' + encodeURIComponent(arguments[n])
  }
  return (
    'Minified React error #' +
    e +
    '; visit ' +
    t +
    ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
  )
}
function Yd(e) {
  return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11))
}
var bp = Symbol.for('react.element'),
  Da = Symbol.for('react.transitional.element'),
  Su = Symbol.for('react.portal'),
  El = Symbol.for('react.fragment'),
  Gd = Symbol.for('react.strict_mode'),
  fc = Symbol.for('react.profiler'),
  Ep = Symbol.for('react.provider'),
  Xd = Symbol.for('react.consumer'),
  Gt = Symbol.for('react.context'),
  Ef = Symbol.for('react.forward_ref'),
  oc = Symbol.for('react.suspense'),
  sc = Symbol.for('react.suspense_list'),
  Sf = Symbol.for('react.memo'),
  an = Symbol.for('react.lazy'),
  Qd = Symbol.for('react.offscreen'),
  Sp = Symbol.for('react.memo_cache_sentinel'),
  Ho = Symbol.iterator
function du(e) {
  return e === null || typeof e != 'object'
    ? null
    : ((e = (Ho && e[Ho]) || e['@@iterator']), typeof e == 'function' ? e : null)
}
var xp = Symbol.for('react.client.reference')
function dc(e) {
  if (e == null) return null
  if (typeof e == 'function') return e.$$typeof === xp ? null : e.displayName || e.name || null
  if (typeof e == 'string') return e
  switch (e) {
    case El:
      return 'Fragment'
    case Su:
      return 'Portal'
    case fc:
      return 'Profiler'
    case Gd:
      return 'StrictMode'
    case oc:
      return 'Suspense'
    case sc:
      return 'SuspenseList'
  }
  if (typeof e == 'object')
    switch (e.$$typeof) {
      case Gt:
        return (e.displayName || 'Context') + '.Provider'
      case Xd:
        return (e._context.displayName || 'Context') + '.Consumer'
      case Ef:
        var t = e.render
        return (
          (e = e.displayName),
          e ||
            ((e = t.displayName || t.name || ''),
            (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')),
          e
        )
      case Sf:
        return (t = e.displayName || null), t !== null ? t : dc(e.type) || 'Memo'
      case an:
        ;(t = e._payload), (e = e._init)
        try {
          return dc(e(t))
        } catch {}
    }
  return null
}
var B = $d.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  ue = Object.assign,
  yr,
  Lo
function xu(e) {
  if (yr === void 0)
    try {
      throw Error()
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/)
      ;(yr = (t && t[1]) || ''),
        (Lo =
          -1 <
          n.stack.indexOf(`
    at`)
            ? ' (<anonymous>)'
            : -1 < n.stack.indexOf('@')
            ? '@unknown:0:0'
            : '')
    }
  return (
    `
` +
    yr +
    e +
    Lo
  )
}
var br = !1
function Er(e, t) {
  if (!e || br) return ''
  br = !0
  var n = Error.prepareStackTrace
  Error.prepareStackTrace = void 0
  try {
    var l = {
      DetermineComponentFrameRoot: function () {
        try {
          if (t) {
            var g = function () {
              throw Error()
            }
            if (
              (Object.defineProperty(g.prototype, 'props', {
                set: function () {
                  throw Error()
                }
              }),
              typeof Reflect == 'object' && Reflect.construct)
            ) {
              try {
                Reflect.construct(g, [])
              } catch (s) {
                var m = s
              }
              Reflect.construct(e, [], g)
            } else {
              try {
                g.call()
              } catch (s) {
                m = s
              }
              e.call(g.prototype)
            }
          } else {
            try {
              throw Error()
            } catch (s) {
              m = s
            }
            ;(g = e()) && typeof g.catch == 'function' && g.catch(function () {})
          }
        } catch (s) {
          if (s && m && typeof s.stack == 'string') return [s.stack, m.stack]
        }
        return [null, null]
      }
    }
    l.DetermineComponentFrameRoot.displayName = 'DetermineComponentFrameRoot'
    var u = Object.getOwnPropertyDescriptor(l.DetermineComponentFrameRoot, 'name')
    u &&
      u.configurable &&
      Object.defineProperty(l.DetermineComponentFrameRoot, 'name', {
        value: 'DetermineComponentFrameRoot'
      })
    var a = l.DetermineComponentFrameRoot(),
      i = a[0],
      r = a[1]
    if (i && r) {
      var c = i.split(`
`),
        f = r.split(`
`)
      for (u = l = 0; l < c.length && !c[l].includes('DetermineComponentFrameRoot'); ) l++
      for (; u < f.length && !f[u].includes('DetermineComponentFrameRoot'); ) u++
      if (l === c.length || u === f.length)
        for (l = c.length - 1, u = f.length - 1; 1 <= l && 0 <= u && c[l] !== f[u]; ) u--
      for (; 1 <= l && 0 <= u; l--, u--)
        if (c[l] !== f[u]) {
          if (l !== 1 || u !== 1)
            do
              if ((l--, u--, 0 > u || c[l] !== f[u])) {
                var o =
                  `
` + c[l].replace(' at new ', ' at ')
                return (
                  e.displayName &&
                    o.includes('<anonymous>') &&
                    (o = o.replace('<anonymous>', e.displayName)),
                  o
                )
              }
            while (1 <= l && 0 <= u)
          break
        }
    }
  } finally {
    ;(br = !1), (Error.prepareStackTrace = n)
  }
  return (n = e ? e.displayName || e.name : '') ? xu(n) : ''
}
function Tp(e) {
  switch (e.tag) {
    case 26:
    case 27:
    case 5:
      return xu(e.type)
    case 16:
      return xu('Lazy')
    case 13:
      return xu('Suspense')
    case 19:
      return xu('SuspenseList')
    case 0:
    case 15:
      return (e = Er(e.type, !1)), e
    case 11:
      return (e = Er(e.type.render, !1)), e
    case 1:
      return (e = Er(e.type, !0)), e
    default:
      return ''
  }
}
function Uo(e) {
  try {
    var t = ''
    do (t += Tp(e)), (e = e.return)
    while (e)
    return t
  } catch (n) {
    return (
      `
Error generating stack: ` +
      n.message +
      `
` +
      n.stack
    )
  }
}
function eu(e) {
  var t = e,
    n = e
  if (e.alternate) for (; t.return; ) t = t.return
  else {
    e = t
    do (t = e), t.flags & 4098 && (n = t.return), (e = t.return)
    while (e)
  }
  return t.tag === 3 ? n : null
}
function Vd(e) {
  if (e.tag === 13) {
    var t = e.memoizedState
    if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null))
      return t.dehydrated
  }
  return null
}
function jo(e) {
  if (eu(e) !== e) throw Error(T(188))
}
function Op(e) {
  var t = e.alternate
  if (!t) {
    if (((t = eu(e)), t === null)) throw Error(T(188))
    return t !== e ? null : e
  }
  for (var n = e, l = t; ; ) {
    var u = n.return
    if (u === null) break
    var a = u.alternate
    if (a === null) {
      if (((l = u.return), l !== null)) {
        n = l
        continue
      }
      break
    }
    if (u.child === a.child) {
      for (a = u.child; a; ) {
        if (a === n) return jo(u), e
        if (a === l) return jo(u), t
        a = a.sibling
      }
      throw Error(T(188))
    }
    if (n.return !== l.return) (n = u), (l = a)
    else {
      for (var i = !1, r = u.child; r; ) {
        if (r === n) {
          ;(i = !0), (n = u), (l = a)
          break
        }
        if (r === l) {
          ;(i = !0), (l = u), (n = a)
          break
        }
        r = r.sibling
      }
      if (!i) {
        for (r = a.child; r; ) {
          if (r === n) {
            ;(i = !0), (n = a), (l = u)
            break
          }
          if (r === l) {
            ;(i = !0), (l = a), (n = u)
            break
          }
          r = r.sibling
        }
        if (!i) throw Error(T(189))
      }
    }
    if (n.alternate !== l) throw Error(T(190))
  }
  if (n.tag !== 3) throw Error(T(188))
  return n.stateNode.current === n ? e : t
}
function Zd(e) {
  var t = e.tag
  if (t === 5 || t === 26 || t === 27 || t === 6) return e
  for (e = e.child; e !== null; ) {
    if (((t = Zd(e)), t !== null)) return t
    e = e.sibling
  }
  return null
}
var Tu = Array.isArray,
  ne = yp.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
  Vn = { pending: !1, data: null, method: null, action: null },
  mc = [],
  Sl = -1
function Nt(e) {
  return { current: e }
}
function De(e) {
  0 > Sl || ((e.current = mc[Sl]), (mc[Sl] = null), Sl--)
}
function re(e, t) {
  Sl++, (mc[Sl] = e.current), (e.current = t)
}
var At = Nt(null),
  Vu = Nt(null),
  pn = Nt(null),
  ai = Nt(null)
function ii(e, t) {
  switch ((re(pn, t), re(Vu, e), re(At, null), (e = t.nodeType), e)) {
    case 9:
    case 11:
      t = (t = t.documentElement) && (t = t.namespaceURI) ? qs(t) : 0
      break
    default:
      if (((e = e === 8 ? t.parentNode : t), (t = e.tagName), (e = e.namespaceURI)))
        (e = qs(e)), (t = ug(e, t))
      else
        switch (t) {
          case 'svg':
            t = 1
            break
          case 'math':
            t = 2
            break
          default:
            t = 0
        }
  }
  De(At), re(At, t)
}
function Yl() {
  De(At), De(Vu), De(pn)
}
function hc(e) {
  e.memoizedState !== null && re(ai, e)
  var t = At.current,
    n = ug(t, e.type)
  t !== n && (re(Vu, e), re(At, n))
}
function ri(e) {
  Vu.current === e && (De(At), De(Vu)), ai.current === e && (De(ai), (na._currentValue = Vn))
}
var gc = Object.prototype.hasOwnProperty,
  xf = we.unstable_scheduleCallback,
  Sr = we.unstable_cancelCallback,
  wp = we.unstable_shouldYield,
  Ap = we.unstable_requestPaint,
  Rt = we.unstable_now,
  Rp = we.unstable_getCurrentPriorityLevel,
  kd = we.unstable_ImmediatePriority,
  Fd = we.unstable_UserBlockingPriority,
  ci = we.unstable_NormalPriority,
  Mp = we.unstable_LowPriority,
  Kd = we.unstable_IdlePriority,
  Dp = we.log,
  _p = we.unstable_setDisableYieldValue,
  fa = null,
  Ie = null
function Cp(e) {
  if (Ie && typeof Ie.onCommitFiberRoot == 'function')
    try {
      Ie.onCommitFiberRoot(fa, e, void 0, (e.current.flags & 128) === 128)
    } catch {}
}
function hn(e) {
  if ((typeof Dp == 'function' && _p(e), Ie && typeof Ie.setStrictMode == 'function'))
    try {
      Ie.setStrictMode(fa, e)
    } catch {}
}
var et = Math.clz32 ? Math.clz32 : Hp,
  Np = Math.log,
  zp = Math.LN2
function Hp(e) {
  return (e >>>= 0), e === 0 ? 32 : (31 - ((Np(e) / zp) | 0)) | 0
}
var _a = 128,
  Ca = 4194304
function jn(e) {
  var t = e & 42
  if (t !== 0) return t
  switch (e & -e) {
    case 1:
      return 1
    case 2:
      return 2
    case 4:
      return 4
    case 8:
      return 8
    case 16:
      return 16
    case 32:
      return 32
    case 64:
      return 64
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194176
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
      return e & 62914560
    case 67108864:
      return 67108864
    case 134217728:
      return 134217728
    case 268435456:
      return 268435456
    case 536870912:
      return 536870912
    case 1073741824:
      return 0
    default:
      return e
  }
}
function Gi(e, t) {
  var n = e.pendingLanes
  if (n === 0) return 0
  var l = 0,
    u = e.suspendedLanes,
    a = e.pingedLanes,
    i = e.warmLanes
  e = e.finishedLanes !== 0
  var r = n & 134217727
  return (
    r !== 0
      ? ((n = r & ~u),
        n !== 0
          ? (l = jn(n))
          : ((a &= r), a !== 0 ? (l = jn(a)) : e || ((i = r & ~i), i !== 0 && (l = jn(i)))))
      : ((r = n & ~u),
        r !== 0
          ? (l = jn(r))
          : a !== 0
          ? (l = jn(a))
          : e || ((i = n & ~i), i !== 0 && (l = jn(i)))),
    l === 0
      ? 0
      : t !== 0 &&
        t !== l &&
        !(t & u) &&
        ((u = l & -l), (i = t & -t), u >= i || (u === 32 && (i & 4194176) !== 0))
      ? t
      : l
  )
}
function oa(e, t) {
  return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0
}
function Lp(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
    case 8:
      return t + 250
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
      return -1
    case 67108864:
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1
    default:
      return -1
  }
}
function Jd() {
  var e = _a
  return (_a <<= 1), !(_a & 4194176) && (_a = 128), e
}
function Wd() {
  var e = Ca
  return (Ca <<= 1), !(Ca & 62914560) && (Ca = 4194304), e
}
function xr(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e)
  return t
}
function sa(e, t) {
  ;(e.pendingLanes |= t),
    t !== 268435456 && ((e.suspendedLanes = 0), (e.pingedLanes = 0), (e.warmLanes = 0))
}
function Up(e, t, n, l, u, a) {
  var i = e.pendingLanes
  ;(e.pendingLanes = n),
    (e.suspendedLanes = 0),
    (e.pingedLanes = 0),
    (e.warmLanes = 0),
    (e.expiredLanes &= n),
    (e.entangledLanes &= n),
    (e.errorRecoveryDisabledLanes &= n),
    (e.shellSuspendCounter = 0)
  var r = e.entanglements,
    c = e.expirationTimes,
    f = e.hiddenUpdates
  for (n = i & ~n; 0 < n; ) {
    var o = 31 - et(n),
      g = 1 << o
    ;(r[o] = 0), (c[o] = -1)
    var m = f[o]
    if (m !== null)
      for (f[o] = null, o = 0; o < m.length; o++) {
        var s = m[o]
        s !== null && (s.lane &= -536870913)
      }
    n &= ~g
  }
  l !== 0 && Pd(e, l, 0), a !== 0 && u === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(i & ~t))
}
function Pd(e, t, n) {
  ;(e.pendingLanes |= t), (e.suspendedLanes &= ~t)
  var l = 31 - et(t)
  ;(e.entangledLanes |= t), (e.entanglements[l] = e.entanglements[l] | 1073741824 | (n & 4194218))
}
function Id(e, t) {
  var n = (e.entangledLanes |= t)
  for (e = e.entanglements; n; ) {
    var l = 31 - et(n),
      u = 1 << l
    ;(u & t) | (e[l] & t) && (e[l] |= t), (n &= ~u)
  }
}
function em(e) {
  return (e &= -e), 2 < e ? (8 < e ? (e & 134217727 ? 32 : 268435456) : 8) : 2
}
function tm() {
  var e = ne.p
  return e !== 0 ? e : ((e = window.event), e === void 0 ? 32 : hg(e.type))
}
function jp(e, t) {
  var n = ne.p
  try {
    return (ne.p = e), t()
  } finally {
    ne.p = n
  }
}
var Cn = Math.random().toString(36).slice(2),
  je = '__reactFiber$' + Cn,
  Fe = '__reactProps$' + Cn,
  tu = '__reactContainer$' + Cn,
  vc = '__reactEvents$' + Cn,
  qp = '__reactListeners$' + Cn,
  Bp = '__reactHandles$' + Cn,
  qo = '__reactResources$' + Cn,
  Zu = '__reactMarker$' + Cn
function Tf(e) {
  delete e[je], delete e[Fe], delete e[vc], delete e[qp], delete e[Bp]
}
function Yn(e) {
  var t = e[je]
  if (t) return t
  for (var n = e.parentNode; n; ) {
    if ((t = n[tu] || n[je])) {
      if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
        for (e = $s(e); e !== null; ) {
          if ((n = e[je])) return n
          e = $s(e)
        }
      return t
    }
    ;(e = n), (n = e.parentNode)
  }
  return null
}
function nu(e) {
  if ((e = e[je] || e[tu])) {
    var t = e.tag
    if (t === 5 || t === 6 || t === 13 || t === 26 || t === 27 || t === 3) return e
  }
  return null
}
function Ou(e) {
  var t = e.tag
  if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode
  throw Error(T(33))
}
function Cl(e) {
  var t = e[qo]
  return t || (t = e[qo] = { hoistableStyles: new Map(), hoistableScripts: new Map() }), t
}
function Re(e) {
  e[Zu] = !0
}
var nm = new Set(),
  lm = {}
function rl(e, t) {
  Gl(e, t), Gl(e + 'Capture', t)
}
function Gl(e, t) {
  for (lm[e] = t, e = 0; e < t.length; e++) nm.add(t[e])
}
var Kt = !(
    typeof window > 'u' ||
    typeof window.document > 'u' ||
    typeof window.document.createElement > 'u'
  ),
  $p = RegExp(
    '^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$'
  ),
  Bo = {},
  $o = {}
function Yp(e) {
  return gc.call($o, e) ? !0 : gc.call(Bo, e) ? !1 : $p.test(e) ? ($o[e] = !0) : ((Bo[e] = !0), !1)
}
function Za(e, t, n) {
  if (Yp(t))
    if (n === null) e.removeAttribute(t)
    else {
      switch (typeof n) {
        case 'undefined':
        case 'function':
        case 'symbol':
          e.removeAttribute(t)
          return
        case 'boolean':
          var l = t.toLowerCase().slice(0, 5)
          if (l !== 'data-' && l !== 'aria-') {
            e.removeAttribute(t)
            return
          }
      }
      e.setAttribute(t, '' + n)
    }
}
function Na(e, t, n) {
  if (n === null) e.removeAttribute(t)
  else {
    switch (typeof n) {
      case 'undefined':
      case 'function':
      case 'symbol':
      case 'boolean':
        e.removeAttribute(t)
        return
    }
    e.setAttribute(t, '' + n)
  }
}
function Lt(e, t, n, l) {
  if (l === null) e.removeAttribute(n)
  else {
    switch (typeof l) {
      case 'undefined':
      case 'function':
      case 'symbol':
      case 'boolean':
        e.removeAttribute(n)
        return
    }
    e.setAttributeNS(t, n, '' + l)
  }
}
function rt(e) {
  switch (typeof e) {
    case 'bigint':
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return e
    case 'object':
      return e
    default:
      return ''
  }
}
function um(e) {
  var t = e.type
  return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio')
}
function Gp(e) {
  var t = um(e) ? 'checked' : 'value',
    n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
    l = '' + e[t]
  if (
    !e.hasOwnProperty(t) &&
    typeof n < 'u' &&
    typeof n.get == 'function' &&
    typeof n.set == 'function'
  ) {
    var u = n.get,
      a = n.set
    return (
      Object.defineProperty(e, t, {
        configurable: !0,
        get: function () {
          return u.call(this)
        },
        set: function (i) {
          ;(l = '' + i), a.call(this, i)
        }
      }),
      Object.defineProperty(e, t, { enumerable: n.enumerable }),
      {
        getValue: function () {
          return l
        },
        setValue: function (i) {
          l = '' + i
        },
        stopTracking: function () {
          ;(e._valueTracker = null), delete e[t]
        }
      }
    )
  }
}
function fi(e) {
  e._valueTracker || (e._valueTracker = Gp(e))
}
function am(e) {
  if (!e) return !1
  var t = e._valueTracker
  if (!t) return !0
  var n = t.getValue(),
    l = ''
  return (
    e && (l = um(e) ? (e.checked ? 'true' : 'false') : e.value),
    (e = l),
    e !== n ? (t.setValue(e), !0) : !1
  )
}
function oi(e) {
  if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null
  try {
    return e.activeElement || e.body
  } catch {
    return e.body
  }
}
var Xp = /[\n"\\]/g
function st(e) {
  return e.replace(Xp, function (t) {
    return '\\' + t.charCodeAt(0).toString(16) + ' '
  })
}
function pc(e, t, n, l, u, a, i, r) {
  ;(e.name = ''),
    i != null && typeof i != 'function' && typeof i != 'symbol' && typeof i != 'boolean'
      ? (e.type = i)
      : e.removeAttribute('type'),
    t != null
      ? i === 'number'
        ? ((t === 0 && e.value === '') || e.value != t) && (e.value = '' + rt(t))
        : e.value !== '' + rt(t) && (e.value = '' + rt(t))
      : (i !== 'submit' && i !== 'reset') || e.removeAttribute('value'),
    t != null
      ? yc(e, i, rt(t))
      : n != null
      ? yc(e, i, rt(n))
      : l != null && e.removeAttribute('value'),
    u == null && a != null && (e.defaultChecked = !!a),
    u != null && (e.checked = u && typeof u != 'function' && typeof u != 'symbol'),
    r != null && typeof r != 'function' && typeof r != 'symbol' && typeof r != 'boolean'
      ? (e.name = '' + rt(r))
      : e.removeAttribute('name')
}
function im(e, t, n, l, u, a, i, r) {
  if (
    (a != null &&
      typeof a != 'function' &&
      typeof a != 'symbol' &&
      typeof a != 'boolean' &&
      (e.type = a),
    t != null || n != null)
  ) {
    if (!((a !== 'submit' && a !== 'reset') || t != null)) return
    ;(n = n != null ? '' + rt(n) : ''),
      (t = t != null ? '' + rt(t) : n),
      r || t === e.value || (e.value = t),
      (e.defaultValue = t)
  }
  ;(l = l ?? u),
    (l = typeof l != 'function' && typeof l != 'symbol' && !!l),
    (e.checked = r ? e.checked : !!l),
    (e.defaultChecked = !!l),
    i != null &&
      typeof i != 'function' &&
      typeof i != 'symbol' &&
      typeof i != 'boolean' &&
      (e.name = i)
}
function yc(e, t, n) {
  ;(t === 'number' && oi(e.ownerDocument) === e) ||
    e.defaultValue === '' + n ||
    (e.defaultValue = '' + n)
}
function Nl(e, t, n, l) {
  if (((e = e.options), t)) {
    t = {}
    for (var u = 0; u < n.length; u++) t['$' + n[u]] = !0
    for (n = 0; n < e.length; n++)
      (u = t.hasOwnProperty('$' + e[n].value)),
        e[n].selected !== u && (e[n].selected = u),
        u && l && (e[n].defaultSelected = !0)
  } else {
    for (n = '' + rt(n), t = null, u = 0; u < e.length; u++) {
      if (e[u].value === n) {
        ;(e[u].selected = !0), l && (e[u].defaultSelected = !0)
        return
      }
      t !== null || e[u].disabled || (t = e[u])
    }
    t !== null && (t.selected = !0)
  }
}
function rm(e, t, n) {
  if (t != null && ((t = '' + rt(t)), t !== e.value && (e.value = t), n == null)) {
    e.defaultValue !== t && (e.defaultValue = t)
    return
  }
  e.defaultValue = n != null ? '' + rt(n) : ''
}
function cm(e, t, n, l) {
  if (t == null) {
    if (l != null) {
      if (n != null) throw Error(T(92))
      if (Tu(l)) {
        if (1 < l.length) throw Error(T(93))
        l = l[0]
      }
      n = l
    }
    n == null && (n = ''), (t = n)
  }
  ;(n = rt(t)),
    (e.defaultValue = n),
    (l = e.textContent),
    l === n && l !== '' && l !== null && (e.value = l)
}
function Xl(e, t) {
  if (t) {
    var n = e.firstChild
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t
      return
    }
  }
  e.textContent = t
}
var Qp = new Set(
  'animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp'.split(
    ' '
  )
)
function Yo(e, t, n) {
  var l = t.indexOf('--') === 0
  n == null || typeof n == 'boolean' || n === ''
    ? l
      ? e.setProperty(t, '')
      : t === 'float'
      ? (e.cssFloat = '')
      : (e[t] = '')
    : l
    ? e.setProperty(t, n)
    : typeof n != 'number' || n === 0 || Qp.has(t)
    ? t === 'float'
      ? (e.cssFloat = n)
      : (e[t] = ('' + n).trim())
    : (e[t] = n + 'px')
}
function fm(e, t, n) {
  if (t != null && typeof t != 'object') throw Error(T(62))
  if (((e = e.style), n != null)) {
    for (var l in n)
      !n.hasOwnProperty(l) ||
        (t != null && t.hasOwnProperty(l)) ||
        (l.indexOf('--') === 0
          ? e.setProperty(l, '')
          : l === 'float'
          ? (e.cssFloat = '')
          : (e[l] = ''))
    for (var u in t) (l = t[u]), t.hasOwnProperty(u) && n[u] !== l && Yo(e, u, l)
  } else for (var a in t) t.hasOwnProperty(a) && Yo(e, a, t[a])
}
function Of(e) {
  if (e.indexOf('-') === -1) return !1
  switch (e) {
    case 'annotation-xml':
    case 'color-profile':
    case 'font-face':
    case 'font-face-src':
    case 'font-face-uri':
    case 'font-face-format':
    case 'font-face-name':
    case 'missing-glyph':
      return !1
    default:
      return !0
  }
}
var Vp = new Map([
    ['acceptCharset', 'accept-charset'],
    ['htmlFor', 'for'],
    ['httpEquiv', 'http-equiv'],
    ['crossOrigin', 'crossorigin'],
    ['accentHeight', 'accent-height'],
    ['alignmentBaseline', 'alignment-baseline'],
    ['arabicForm', 'arabic-form'],
    ['baselineShift', 'baseline-shift'],
    ['capHeight', 'cap-height'],
    ['clipPath', 'clip-path'],
    ['clipRule', 'clip-rule'],
    ['colorInterpolation', 'color-interpolation'],
    ['colorInterpolationFilters', 'color-interpolation-filters'],
    ['colorProfile', 'color-profile'],
    ['colorRendering', 'color-rendering'],
    ['dominantBaseline', 'dominant-baseline'],
    ['enableBackground', 'enable-background'],
    ['fillOpacity', 'fill-opacity'],
    ['fillRule', 'fill-rule'],
    ['floodColor', 'flood-color'],
    ['floodOpacity', 'flood-opacity'],
    ['fontFamily', 'font-family'],
    ['fontSize', 'font-size'],
    ['fontSizeAdjust', 'font-size-adjust'],
    ['fontStretch', 'font-stretch'],
    ['fontStyle', 'font-style'],
    ['fontVariant', 'font-variant'],
    ['fontWeight', 'font-weight'],
    ['glyphName', 'glyph-name'],
    ['glyphOrientationHorizontal', 'glyph-orientation-horizontal'],
    ['glyphOrientationVertical', 'glyph-orientation-vertical'],
    ['horizAdvX', 'horiz-adv-x'],
    ['horizOriginX', 'horiz-origin-x'],
    ['imageRendering', 'image-rendering'],
    ['letterSpacing', 'letter-spacing'],
    ['lightingColor', 'lighting-color'],
    ['markerEnd', 'marker-end'],
    ['markerMid', 'marker-mid'],
    ['markerStart', 'marker-start'],
    ['overlinePosition', 'overline-position'],
    ['overlineThickness', 'overline-thickness'],
    ['paintOrder', 'paint-order'],
    ['panose-1', 'panose-1'],
    ['pointerEvents', 'pointer-events'],
    ['renderingIntent', 'rendering-intent'],
    ['shapeRendering', 'shape-rendering'],
    ['stopColor', 'stop-color'],
    ['stopOpacity', 'stop-opacity'],
    ['strikethroughPosition', 'strikethrough-position'],
    ['strikethroughThickness', 'strikethrough-thickness'],
    ['strokeDasharray', 'stroke-dasharray'],
    ['strokeDashoffset', 'stroke-dashoffset'],
    ['strokeLinecap', 'stroke-linecap'],
    ['strokeLinejoin', 'stroke-linejoin'],
    ['strokeMiterlimit', 'stroke-miterlimit'],
    ['strokeOpacity', 'stroke-opacity'],
    ['strokeWidth', 'stroke-width'],
    ['textAnchor', 'text-anchor'],
    ['textDecoration', 'text-decoration'],
    ['textRendering', 'text-rendering'],
    ['transformOrigin', 'transform-origin'],
    ['underlinePosition', 'underline-position'],
    ['underlineThickness', 'underline-thickness'],
    ['unicodeBidi', 'unicode-bidi'],
    ['unicodeRange', 'unicode-range'],
    ['unitsPerEm', 'units-per-em'],
    ['vAlphabetic', 'v-alphabetic'],
    ['vHanging', 'v-hanging'],
    ['vIdeographic', 'v-ideographic'],
    ['vMathematical', 'v-mathematical'],
    ['vectorEffect', 'vector-effect'],
    ['vertAdvY', 'vert-adv-y'],
    ['vertOriginX', 'vert-origin-x'],
    ['vertOriginY', 'vert-origin-y'],
    ['wordSpacing', 'word-spacing'],
    ['writingMode', 'writing-mode'],
    ['xmlnsXlink', 'xmlns:xlink'],
    ['xHeight', 'x-height']
  ]),
  Zp =
    /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i
function ka(e) {
  return Zp.test('' + e)
    ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')"
    : e
}
var bc = null
function wf(e) {
  return (
    (e = e.target || e.srcElement || window),
    e.correspondingUseElement && (e = e.correspondingUseElement),
    e.nodeType === 3 ? e.parentNode : e
  )
}
var xl = null,
  zl = null
function Go(e) {
  var t = nu(e)
  if (t && (e = t.stateNode)) {
    var n = e[Fe] || null
    e: switch (((e = t.stateNode), t.type)) {
      case 'input':
        if (
          (pc(
            e,
            n.value,
            n.defaultValue,
            n.defaultValue,
            n.checked,
            n.defaultChecked,
            n.type,
            n.name
          ),
          (t = n.name),
          n.type === 'radio' && t != null)
        ) {
          for (n = e; n.parentNode; ) n = n.parentNode
          for (
            n = n.querySelectorAll('input[name="' + st('' + t) + '"][type="radio"]'), t = 0;
            t < n.length;
            t++
          ) {
            var l = n[t]
            if (l !== e && l.form === e.form) {
              var u = l[Fe] || null
              if (!u) throw Error(T(90))
              pc(
                l,
                u.value,
                u.defaultValue,
                u.defaultValue,
                u.checked,
                u.defaultChecked,
                u.type,
                u.name
              )
            }
          }
          for (t = 0; t < n.length; t++) (l = n[t]), l.form === e.form && am(l)
        }
        break e
      case 'textarea':
        rm(e, n.value, n.defaultValue)
        break e
      case 'select':
        ;(t = n.value), t != null && Nl(e, !!n.multiple, t, !1)
    }
  }
}
var Tr = !1
function om(e, t, n) {
  if (Tr) return e(t, n)
  Tr = !0
  try {
    var l = e(t)
    return l
  } finally {
    if (
      ((Tr = !1),
      (xl !== null || zl !== null) &&
        (Pi(), xl && ((t = xl), (e = zl), (zl = xl = null), Go(t), e)))
    )
      for (t = 0; t < e.length; t++) Go(e[t])
  }
}
function ku(e, t) {
  var n = e.stateNode
  if (n === null) return null
  var l = n[Fe] || null
  if (l === null) return null
  n = l[t]
  e: switch (t) {
    case 'onClick':
    case 'onClickCapture':
    case 'onDoubleClick':
    case 'onDoubleClickCapture':
    case 'onMouseDown':
    case 'onMouseDownCapture':
    case 'onMouseMove':
    case 'onMouseMoveCapture':
    case 'onMouseUp':
    case 'onMouseUpCapture':
    case 'onMouseEnter':
      ;(l = !l.disabled) ||
        ((e = e.type),
        (l = !(e === 'button' || e === 'input' || e === 'select' || e === 'textarea'))),
        (e = !l)
      break e
    default:
      e = !1
  }
  if (e) return null
  if (n && typeof n != 'function') throw Error(T(231, t, typeof n))
  return n
}
var Ec = !1
if (Kt)
  try {
    var mu = {}
    Object.defineProperty(mu, 'passive', {
      get: function () {
        Ec = !0
      }
    }),
      window.addEventListener('test', mu, mu),
      window.removeEventListener('test', mu, mu)
  } catch {
    Ec = !1
  }
var gn = null,
  Af = null,
  Fa = null
function sm() {
  if (Fa) return Fa
  var e,
    t = Af,
    n = t.length,
    l,
    u = 'value' in gn ? gn.value : gn.textContent,
    a = u.length
  for (e = 0; e < n && t[e] === u[e]; e++);
  var i = n - e
  for (l = 1; l <= i && t[n - l] === u[a - l]; l++);
  return (Fa = u.slice(e, 1 < l ? 1 - l : void 0))
}
function Ka(e) {
  var t = e.keyCode
  return (
    'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t),
    e === 10 && (e = 13),
    32 <= e || e === 13 ? e : 0
  )
}
function za() {
  return !0
}
function Xo() {
  return !1
}
function Ke(e) {
  function t(n, l, u, a, i) {
    ;(this._reactName = n),
      (this._targetInst = u),
      (this.type = l),
      (this.nativeEvent = a),
      (this.target = i),
      (this.currentTarget = null)
    for (var r in e) e.hasOwnProperty(r) && ((n = e[r]), (this[r] = n ? n(a) : a[r]))
    return (
      (this.isDefaultPrevented = (
        a.defaultPrevented != null ? a.defaultPrevented : a.returnValue === !1
      )
        ? za
        : Xo),
      (this.isPropagationStopped = Xo),
      this
    )
  }
  return (
    ue(t.prototype, {
      preventDefault: function () {
        this.defaultPrevented = !0
        var n = this.nativeEvent
        n &&
          (n.preventDefault
            ? n.preventDefault()
            : typeof n.returnValue != 'unknown' && (n.returnValue = !1),
          (this.isDefaultPrevented = za))
      },
      stopPropagation: function () {
        var n = this.nativeEvent
        n &&
          (n.stopPropagation
            ? n.stopPropagation()
            : typeof n.cancelBubble != 'unknown' && (n.cancelBubble = !0),
          (this.isPropagationStopped = za))
      },
      persist: function () {},
      isPersistent: za
    }),
    t
  )
}
var cl = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function (e) {
      return e.timeStamp || Date.now()
    },
    defaultPrevented: 0,
    isTrusted: 0
  },
  Xi = Ke(cl),
  da = ue({}, cl, { view: 0, detail: 0 }),
  kp = Ke(da),
  Or,
  wr,
  hu,
  Qi = ue({}, da, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: Rf,
    button: 0,
    buttons: 0,
    relatedTarget: function (e) {
      return e.relatedTarget === void 0
        ? e.fromElement === e.srcElement
          ? e.toElement
          : e.fromElement
        : e.relatedTarget
    },
    movementX: function (e) {
      return 'movementX' in e
        ? e.movementX
        : (e !== hu &&
            (hu && e.type === 'mousemove'
              ? ((Or = e.screenX - hu.screenX), (wr = e.screenY - hu.screenY))
              : (wr = Or = 0),
            (hu = e)),
          Or)
    },
    movementY: function (e) {
      return 'movementY' in e ? e.movementY : wr
    }
  }),
  Qo = Ke(Qi),
  Fp = ue({}, Qi, { dataTransfer: 0 }),
  Kp = Ke(Fp),
  Jp = ue({}, da, { relatedTarget: 0 }),
  Ar = Ke(Jp),
  Wp = ue({}, cl, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
  Pp = Ke(Wp),
  Ip = ue({}, cl, {
    clipboardData: function (e) {
      return 'clipboardData' in e ? e.clipboardData : window.clipboardData
    }
  }),
  e0 = Ke(Ip),
  t0 = ue({}, cl, { data: 0 }),
  Vo = Ke(t0),
  n0 = {
    Esc: 'Escape',
    Spacebar: ' ',
    Left: 'ArrowLeft',
    Up: 'ArrowUp',
    Right: 'ArrowRight',
    Down: 'ArrowDown',
    Del: 'Delete',
    Win: 'OS',
    Menu: 'ContextMenu',
    Apps: 'ContextMenu',
    Scroll: 'ScrollLock',
    MozPrintableKey: 'Unidentified'
  },
  l0 = {
    8: 'Backspace',
    9: 'Tab',
    12: 'Clear',
    13: 'Enter',
    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    19: 'Pause',
    20: 'CapsLock',
    27: 'Escape',
    32: ' ',
    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    45: 'Insert',
    46: 'Delete',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    144: 'NumLock',
    145: 'ScrollLock',
    224: 'Meta'
  },
  u0 = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' }
function a0(e) {
  var t = this.nativeEvent
  return t.getModifierState ? t.getModifierState(e) : (e = u0[e]) ? !!t[e] : !1
}
function Rf() {
  return a0
}
var i0 = ue({}, da, {
    key: function (e) {
      if (e.key) {
        var t = n0[e.key] || e.key
        if (t !== 'Unidentified') return t
      }
      return e.type === 'keypress'
        ? ((e = Ka(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
        : e.type === 'keydown' || e.type === 'keyup'
        ? l0[e.keyCode] || 'Unidentified'
        : ''
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Rf,
    charCode: function (e) {
      return e.type === 'keypress' ? Ka(e) : 0
    },
    keyCode: function (e) {
      return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0
    },
    which: function (e) {
      return e.type === 'keypress'
        ? Ka(e)
        : e.type === 'keydown' || e.type === 'keyup'
        ? e.keyCode
        : 0
    }
  }),
  r0 = Ke(i0),
  c0 = ue({}, Qi, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  }),
  Zo = Ke(c0),
  f0 = ue({}, da, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Rf
  }),
  o0 = Ke(f0),
  s0 = ue({}, cl, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
  d0 = Ke(s0),
  m0 = ue({}, Qi, {
    deltaX: function (e) {
      return 'deltaX' in e ? e.deltaX : 'wheelDeltaX' in e ? -e.wheelDeltaX : 0
    },
    deltaY: function (e) {
      return 'deltaY' in e
        ? e.deltaY
        : 'wheelDeltaY' in e
        ? -e.wheelDeltaY
        : 'wheelDelta' in e
        ? -e.wheelDelta
        : 0
    },
    deltaZ: 0,
    deltaMode: 0
  }),
  h0 = Ke(m0),
  g0 = ue({}, cl, { newState: 0, oldState: 0 }),
  v0 = Ke(g0),
  p0 = [9, 13, 27, 32],
  Mf = Kt && 'CompositionEvent' in window,
  Mu = null
Kt && 'documentMode' in document && (Mu = document.documentMode)
var y0 = Kt && 'TextEvent' in window && !Mu,
  dm = Kt && (!Mf || (Mu && 8 < Mu && 11 >= Mu)),
  ko = ' ',
  Fo = !1
function mm(e, t) {
  switch (e) {
    case 'keyup':
      return p0.indexOf(t.keyCode) !== -1
    case 'keydown':
      return t.keyCode !== 229
    case 'keypress':
    case 'mousedown':
    case 'focusout':
      return !0
    default:
      return !1
  }
}
function hm(e) {
  return (e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null
}
var Tl = !1
function b0(e, t) {
  switch (e) {
    case 'compositionend':
      return hm(t)
    case 'keypress':
      return t.which !== 32 ? null : ((Fo = !0), ko)
    case 'textInput':
      return (e = t.data), e === ko && Fo ? null : e
    default:
      return null
  }
}
function E0(e, t) {
  if (Tl)
    return e === 'compositionend' || (!Mf && mm(e, t))
      ? ((e = sm()), (Fa = Af = gn = null), (Tl = !1), e)
      : null
  switch (e) {
    case 'paste':
      return null
    case 'keypress':
      if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
        if (t.char && 1 < t.char.length) return t.char
        if (t.which) return String.fromCharCode(t.which)
      }
      return null
    case 'compositionend':
      return dm && t.locale !== 'ko' ? null : t.data
    default:
      return null
  }
}
var S0 = {
  'color': !0,
  'date': !0,
  'datetime': !0,
  'datetime-local': !0,
  'email': !0,
  'month': !0,
  'number': !0,
  'password': !0,
  'range': !0,
  'search': !0,
  'tel': !0,
  'text': !0,
  'time': !0,
  'url': !0,
  'week': !0
}
function Ko(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase()
  return t === 'input' ? !!S0[e.type] : t === 'textarea'
}
function gm(e, t, n, l) {
  xl ? (zl ? zl.push(l) : (zl = [l])) : (xl = l),
    (t = Ai(t, 'onChange')),
    0 < t.length &&
      ((n = new Xi('onChange', 'change', null, n, l)), e.push({ event: n, listeners: t }))
}
var Du = null,
  Fu = null
function x0(e) {
  tg(e, 0)
}
function Vi(e) {
  var t = Ou(e)
  if (am(t)) return e
}
function Jo(e, t) {
  if (e === 'change') return t
}
var vm = !1
if (Kt) {
  var Rr
  if (Kt) {
    var Mr = 'oninput' in document
    if (!Mr) {
      var Wo = document.createElement('div')
      Wo.setAttribute('oninput', 'return;'), (Mr = typeof Wo.oninput == 'function')
    }
    Rr = Mr
  } else Rr = !1
  vm = Rr && (!document.documentMode || 9 < document.documentMode)
}
function Po() {
  Du && (Du.detachEvent('onpropertychange', pm), (Fu = Du = null))
}
function pm(e) {
  if (e.propertyName === 'value' && Vi(Fu)) {
    var t = []
    gm(t, Fu, e, wf(e)), om(x0, t)
  }
}
function T0(e, t, n) {
  e === 'focusin'
    ? (Po(), (Du = t), (Fu = n), Du.attachEvent('onpropertychange', pm))
    : e === 'focusout' && Po()
}
function O0(e) {
  if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return Vi(Fu)
}
function w0(e, t) {
  if (e === 'click') return Vi(t)
}
function A0(e, t) {
  if (e === 'input' || e === 'change') return Vi(t)
}
function R0(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t)
}
var lt = typeof Object.is == 'function' ? Object.is : R0
function Ku(e, t) {
  if (lt(e, t)) return !0
  if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1
  var n = Object.keys(e),
    l = Object.keys(t)
  if (n.length !== l.length) return !1
  for (l = 0; l < n.length; l++) {
    var u = n[l]
    if (!gc.call(t, u) || !lt(e[u], t[u])) return !1
  }
  return !0
}
function Io(e) {
  for (; e && e.firstChild; ) e = e.firstChild
  return e
}
function es(e, t) {
  var n = Io(e)
  e = 0
  for (var l; n; ) {
    if (n.nodeType === 3) {
      if (((l = e + n.textContent.length), e <= t && l >= t)) return { node: n, offset: t - e }
      e = l
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling
          break e
        }
        n = n.parentNode
      }
      n = void 0
    }
    n = Io(n)
  }
}
function ym(e, t) {
  return e && t
    ? e === t
      ? !0
      : e && e.nodeType === 3
      ? !1
      : t && t.nodeType === 3
      ? ym(e, t.parentNode)
      : 'contains' in e
      ? e.contains(t)
      : e.compareDocumentPosition
      ? !!(e.compareDocumentPosition(t) & 16)
      : !1
    : !1
}
function bm(e) {
  e =
    e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null
      ? e.ownerDocument.defaultView
      : window
  for (var t = oi(e.document); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == 'string'
    } catch {
      n = !1
    }
    if (n) e = t.contentWindow
    else break
    t = oi(e.document)
  }
  return t
}
function Df(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase()
  return (
    t &&
    ((t === 'input' &&
      (e.type === 'text' ||
        e.type === 'search' ||
        e.type === 'tel' ||
        e.type === 'url' ||
        e.type === 'password')) ||
      t === 'textarea' ||
      e.contentEditable === 'true')
  )
}
function M0(e, t) {
  var n = bm(t)
  t = e.focusedElem
  var l = e.selectionRange
  if (n !== t && t && t.ownerDocument && ym(t.ownerDocument.documentElement, t)) {
    if (l !== null && Df(t)) {
      if (((e = l.start), (n = l.end), n === void 0 && (n = e), 'selectionStart' in t))
        (t.selectionStart = e), (t.selectionEnd = Math.min(n, t.value.length))
      else if (
        ((n = ((e = t.ownerDocument || document) && e.defaultView) || window), n.getSelection)
      ) {
        n = n.getSelection()
        var u = t.textContent.length,
          a = Math.min(l.start, u)
        ;(l = l.end === void 0 ? a : Math.min(l.end, u)),
          !n.extend && a > l && ((u = l), (l = a), (a = u)),
          (u = es(t, a))
        var i = es(t, l)
        u &&
          i &&
          (n.rangeCount !== 1 ||
            n.anchorNode !== u.node ||
            n.anchorOffset !== u.offset ||
            n.focusNode !== i.node ||
            n.focusOffset !== i.offset) &&
          ((e = e.createRange()),
          e.setStart(u.node, u.offset),
          n.removeAllRanges(),
          a > l
            ? (n.addRange(e), n.extend(i.node, i.offset))
            : (e.setEnd(i.node, i.offset), n.addRange(e)))
      }
    }
    for (e = [], n = t; (n = n.parentNode); )
      n.nodeType === 1 && e.push({ element: n, left: n.scrollLeft, top: n.scrollTop })
    for (typeof t.focus == 'function' && t.focus(), t = 0; t < e.length; t++)
      (n = e[t]), (n.element.scrollLeft = n.left), (n.element.scrollTop = n.top)
  }
}
var D0 = Kt && 'documentMode' in document && 11 >= document.documentMode,
  Ol = null,
  Sc = null,
  _u = null,
  xc = !1
function ts(e, t, n) {
  var l = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument
  xc ||
    Ol == null ||
    Ol !== oi(l) ||
    ((l = Ol),
    'selectionStart' in l && Df(l)
      ? (l = { start: l.selectionStart, end: l.selectionEnd })
      : ((l = ((l.ownerDocument && l.ownerDocument.defaultView) || window).getSelection()),
        (l = {
          anchorNode: l.anchorNode,
          anchorOffset: l.anchorOffset,
          focusNode: l.focusNode,
          focusOffset: l.focusOffset
        })),
    (_u && Ku(_u, l)) ||
      ((_u = l),
      (l = Ai(Sc, 'onSelect')),
      0 < l.length &&
        ((t = new Xi('onSelect', 'select', null, t, n)),
        e.push({ event: t, listeners: l }),
        (t.target = Ol))))
}
function Un(e, t) {
  var n = {}
  return (
    (n[e.toLowerCase()] = t.toLowerCase()),
    (n['Webkit' + e] = 'webkit' + t),
    (n['Moz' + e] = 'moz' + t),
    n
  )
}
var wl = {
    animationend: Un('Animation', 'AnimationEnd'),
    animationiteration: Un('Animation', 'AnimationIteration'),
    animationstart: Un('Animation', 'AnimationStart'),
    transitionrun: Un('Transition', 'TransitionRun'),
    transitionstart: Un('Transition', 'TransitionStart'),
    transitioncancel: Un('Transition', 'TransitionCancel'),
    transitionend: Un('Transition', 'TransitionEnd')
  },
  Dr = {},
  Em = {}
Kt &&
  ((Em = document.createElement('div').style),
  'AnimationEvent' in window ||
    (delete wl.animationend.animation,
    delete wl.animationiteration.animation,
    delete wl.animationstart.animation),
  'TransitionEvent' in window || delete wl.transitionend.transition)
function fl(e) {
  if (Dr[e]) return Dr[e]
  if (!wl[e]) return e
  var t = wl[e],
    n
  for (n in t) if (t.hasOwnProperty(n) && n in Em) return (Dr[e] = t[n])
  return e
}
var Sm = fl('animationend'),
  xm = fl('animationiteration'),
  Tm = fl('animationstart'),
  _0 = fl('transitionrun'),
  C0 = fl('transitionstart'),
  N0 = fl('transitioncancel'),
  Om = fl('transitionend'),
  wm = new Map(),
  ns =
    'abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll scrollEnd toggle touchMove waiting wheel'.split(
      ' '
    )
function xt(e, t) {
  wm.set(e, t), rl(t, [e])
}
var it = [],
  Al = 0,
  _f = 0
function Zi() {
  for (var e = Al, t = (_f = Al = 0); t < e; ) {
    var n = it[t]
    it[t++] = null
    var l = it[t]
    it[t++] = null
    var u = it[t]
    it[t++] = null
    var a = it[t]
    if (((it[t++] = null), l !== null && u !== null)) {
      var i = l.pending
      i === null ? (u.next = u) : ((u.next = i.next), (i.next = u)), (l.pending = u)
    }
    a !== 0 && Am(n, u, a)
  }
}
function ki(e, t, n, l) {
  ;(it[Al++] = e),
    (it[Al++] = t),
    (it[Al++] = n),
    (it[Al++] = l),
    (_f |= l),
    (e.lanes |= l),
    (e = e.alternate),
    e !== null && (e.lanes |= l)
}
function Cf(e, t, n, l) {
  return ki(e, t, n, l), si(e)
}
function wn(e, t) {
  return ki(e, null, null, t), si(e)
}
function Am(e, t, n) {
  e.lanes |= n
  var l = e.alternate
  l !== null && (l.lanes |= n)
  for (var u = !1, a = e.return; a !== null; )
    (a.childLanes |= n),
      (l = a.alternate),
      l !== null && (l.childLanes |= n),
      a.tag === 22 && ((e = a.stateNode), e === null || e._visibility & 1 || (u = !0)),
      (e = a),
      (a = a.return)
  u &&
    t !== null &&
    e.tag === 3 &&
    ((a = e.stateNode),
    (u = 31 - et(n)),
    (a = a.hiddenUpdates),
    (e = a[u]),
    e === null ? (a[u] = [t]) : e.push(t),
    (t.lane = n | 536870912))
}
function si(e) {
  if (50 < Gu) throw ((Gu = 0), (Qc = null), Error(T(185)))
  for (var t = e.return; t !== null; ) (e = t), (t = e.return)
  return e.tag === 3 ? e.stateNode : null
}
var Rl = {},
  ls = new WeakMap()
function dt(e, t) {
  if (typeof e == 'object' && e !== null) {
    var n = ls.get(e)
    return n !== void 0 ? n : ((t = { value: e, source: t, stack: Uo(t) }), ls.set(e, t), t)
  }
  return { value: e, source: t, stack: Uo(t) }
}
var Ml = [],
  Dl = 0,
  di = null,
  mi = 0,
  ct = [],
  ft = 0,
  Zn = null,
  Xt = 1,
  Qt = ''
function qn(e, t) {
  ;(Ml[Dl++] = mi), (Ml[Dl++] = di), (di = e), (mi = t)
}
function Rm(e, t, n) {
  ;(ct[ft++] = Xt), (ct[ft++] = Qt), (ct[ft++] = Zn), (Zn = e)
  var l = Xt
  e = Qt
  var u = 32 - et(l) - 1
  ;(l &= ~(1 << u)), (n += 1)
  var a = 32 - et(t) + u
  if (30 < a) {
    var i = u - (u % 5)
    ;(a = (l & ((1 << i) - 1)).toString(32)),
      (l >>= i),
      (u -= i),
      (Xt = (1 << (32 - et(t) + u)) | (n << u) | l),
      (Qt = a + e)
  } else (Xt = (1 << a) | (n << u) | l), (Qt = e)
}
function Nf(e) {
  e.return !== null && (qn(e, 1), Rm(e, 1, 0))
}
function zf(e) {
  for (; e === di; ) (di = Ml[--Dl]), (Ml[Dl] = null), (mi = Ml[--Dl]), (Ml[Dl] = null)
  for (; e === Zn; )
    (Zn = ct[--ft]),
      (ct[ft] = null),
      (Qt = ct[--ft]),
      (ct[ft] = null),
      (Xt = ct[--ft]),
      (ct[ft] = null)
}
var Be = null,
  Ne = null,
  F = !1,
  yt = null,
  Ot = !1,
  Tc = Error(T(519))
function Pn(e) {
  var t = Error(T(418, ''))
  throw (Ju(dt(t, e)), Tc)
}
function us(e) {
  var t = e.stateNode,
    n = e.type,
    l = e.memoizedProps
  switch (((t[je] = e), (t[Fe] = l), n)) {
    case 'dialog':
      Q('cancel', t), Q('close', t)
      break
    case 'iframe':
    case 'object':
    case 'embed':
      Q('load', t)
      break
    case 'video':
    case 'audio':
      for (n = 0; n < Iu.length; n++) Q(Iu[n], t)
      break
    case 'source':
      Q('error', t)
      break
    case 'img':
    case 'image':
    case 'link':
      Q('error', t), Q('load', t)
      break
    case 'details':
      Q('toggle', t)
      break
    case 'input':
      Q('invalid', t),
        im(t, l.value, l.defaultValue, l.checked, l.defaultChecked, l.type, l.name, !0),
        fi(t)
      break
    case 'select':
      Q('invalid', t)
      break
    case 'textarea':
      Q('invalid', t), cm(t, l.value, l.defaultValue, l.children), fi(t)
  }
  ;(n = l.children),
    (typeof n != 'string' && typeof n != 'number' && typeof n != 'bigint') ||
    t.textContent === '' + n ||
    l.suppressHydrationWarning === !0 ||
    lg(t.textContent, n)
      ? (l.popover != null && (Q('beforetoggle', t), Q('toggle', t)),
        l.onScroll != null && Q('scroll', t),
        l.onScrollEnd != null && Q('scrollend', t),
        l.onClick != null && (t.onclick = er),
        (t = !0))
      : (t = !1),
    t || Pn(e)
}
function as(e) {
  for (Be = e.return; Be; )
    switch (Be.tag) {
      case 3:
      case 27:
        Ot = !0
        return
      case 5:
      case 13:
        Ot = !1
        return
      default:
        Be = Be.return
    }
}
function gu(e) {
  if (e !== Be) return !1
  if (!F) return as(e), (F = !0), !1
  var t = !1,
    n
  if (
    ((n = e.tag !== 3 && e.tag !== 27) &&
      ((n = e.tag === 5) &&
        ((n = e.type), (n = !(n !== 'form' && n !== 'button') || Wc(e.type, e.memoizedProps))),
      (n = !n)),
    n && (t = !0),
    t && Ne && Pn(e),
    as(e),
    e.tag === 13)
  ) {
    if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(T(317))
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8)
          if (((n = e.data), n === '/$')) {
            if (t === 0) {
              Ne = Et(e.nextSibling)
              break e
            }
            t--
          } else (n !== '$' && n !== '$!' && n !== '$?') || t++
        e = e.nextSibling
      }
      Ne = null
    }
  } else Ne = Be ? Et(e.stateNode.nextSibling) : null
  return !0
}
function ma() {
  ;(Ne = Be = null), (F = !1)
}
function Ju(e) {
  yt === null ? (yt = [e]) : yt.push(e)
}
var Cu = Error(T(460)),
  Mm = Error(T(474)),
  Oc = { then: function () {} }
function is(e) {
  return (e = e.status), e === 'fulfilled' || e === 'rejected'
}
function Ha() {}
function Dm(e, t, n) {
  switch (((n = e[n]), n === void 0 ? e.push(t) : n !== t && (t.then(Ha, Ha), (t = n)), t.status)) {
    case 'fulfilled':
      return t.value
    case 'rejected':
      throw ((e = t.reason), e === Cu ? Error(T(483)) : e)
    default:
      if (typeof t.status == 'string') t.then(Ha, Ha)
      else {
        if (((e = te), e !== null && 100 < e.shellSuspendCounter)) throw Error(T(482))
        ;(e = t),
          (e.status = 'pending'),
          e.then(
            function (l) {
              if (t.status === 'pending') {
                var u = t
                ;(u.status = 'fulfilled'), (u.value = l)
              }
            },
            function (l) {
              if (t.status === 'pending') {
                var u = t
                ;(u.status = 'rejected'), (u.reason = l)
              }
            }
          )
      }
      switch (t.status) {
        case 'fulfilled':
          return t.value
        case 'rejected':
          throw ((e = t.reason), e === Cu ? Error(T(483)) : e)
      }
      throw ((Nu = t), Cu)
  }
}
var Nu = null
function rs() {
  if (Nu === null) throw Error(T(459))
  var e = Nu
  return (Nu = null), e
}
var Hl = null,
  Wu = 0
function La(e) {
  var t = Wu
  return (Wu += 1), Hl === null && (Hl = []), Dm(Hl, e, t)
}
function vu(e, t) {
  ;(t = t.props.ref), (e.ref = t !== void 0 ? t : null)
}
function Ua(e, t) {
  throw t.$$typeof === bp
    ? Error(T(525))
    : ((e = Object.prototype.toString.call(t)),
      Error(
        T(31, e === '[object Object]' ? 'object with keys {' + Object.keys(t).join(', ') + '}' : e)
      ))
}
function cs(e) {
  var t = e._init
  return t(e._payload)
}
function _m(e) {
  function t(v, h) {
    if (e) {
      var p = v.deletions
      p === null ? ((v.deletions = [h]), (v.flags |= 16)) : p.push(h)
    }
  }
  function n(v, h) {
    if (!e) return null
    for (; h !== null; ) t(v, h), (h = h.sibling)
    return null
  }
  function l(v) {
    for (var h = new Map(); v !== null; )
      v.key !== null ? h.set(v.key, v) : h.set(v.index, v), (v = v.sibling)
    return h
  }
  function u(v, h) {
    return (v = En(v, h)), (v.index = 0), (v.sibling = null), v
  }
  function a(v, h, p) {
    return (
      (v.index = p),
      e
        ? ((p = v.alternate),
          p !== null
            ? ((p = p.index), p < h ? ((v.flags |= 33554434), h) : p)
            : ((v.flags |= 33554434), h))
        : ((v.flags |= 1048576), h)
    )
  }
  function i(v) {
    return e && v.alternate === null && (v.flags |= 33554434), v
  }
  function r(v, h, p, b) {
    return h === null || h.tag !== 6
      ? ((h = Yr(p, v.mode, b)), (h.return = v), h)
      : ((h = u(h, p)), (h.return = v), h)
  }
  function c(v, h, p, b) {
    var S = p.type
    return S === El
      ? o(v, h, p.props.children, b, p.key)
      : h !== null &&
        (h.elementType === S ||
          (typeof S == 'object' && S !== null && S.$$typeof === an && cs(S) === h.type))
      ? ((h = u(h, p.props)), vu(h, p), (h.return = v), h)
      : ((h = ei(p.type, p.key, p.props, null, v.mode, b)), vu(h, p), (h.return = v), h)
  }
  function f(v, h, p, b) {
    return h === null ||
      h.tag !== 4 ||
      h.stateNode.containerInfo !== p.containerInfo ||
      h.stateNode.implementation !== p.implementation
      ? ((h = Gr(p, v.mode, b)), (h.return = v), h)
      : ((h = u(h, p.children || [])), (h.return = v), h)
  }
  function o(v, h, p, b, S) {
    return h === null || h.tag !== 7
      ? ((h = Fn(p, v.mode, b, S)), (h.return = v), h)
      : ((h = u(h, p)), (h.return = v), h)
  }
  function g(v, h, p) {
    if ((typeof h == 'string' && h !== '') || typeof h == 'number' || typeof h == 'bigint')
      return (h = Yr('' + h, v.mode, p)), (h.return = v), h
    if (typeof h == 'object' && h !== null) {
      switch (h.$$typeof) {
        case Da:
          return (p = ei(h.type, h.key, h.props, null, v.mode, p)), vu(p, h), (p.return = v), p
        case Su:
          return (h = Gr(h, v.mode, p)), (h.return = v), h
        case an:
          var b = h._init
          return (h = b(h._payload)), g(v, h, p)
      }
      if (Tu(h) || du(h)) return (h = Fn(h, v.mode, p, null)), (h.return = v), h
      if (typeof h.then == 'function') return g(v, La(h), p)
      if (h.$$typeof === Gt) return g(v, ja(v, h), p)
      Ua(v, h)
    }
    return null
  }
  function m(v, h, p, b) {
    var S = h !== null ? h.key : null
    if ((typeof p == 'string' && p !== '') || typeof p == 'number' || typeof p == 'bigint')
      return S !== null ? null : r(v, h, '' + p, b)
    if (typeof p == 'object' && p !== null) {
      switch (p.$$typeof) {
        case Da:
          return p.key === S ? c(v, h, p, b) : null
        case Su:
          return p.key === S ? f(v, h, p, b) : null
        case an:
          return (S = p._init), (p = S(p._payload)), m(v, h, p, b)
      }
      if (Tu(p) || du(p)) return S !== null ? null : o(v, h, p, b, null)
      if (typeof p.then == 'function') return m(v, h, La(p), b)
      if (p.$$typeof === Gt) return m(v, h, ja(v, p), b)
      Ua(v, p)
    }
    return null
  }
  function s(v, h, p, b, S) {
    if ((typeof b == 'string' && b !== '') || typeof b == 'number' || typeof b == 'bigint')
      return (v = v.get(p) || null), r(h, v, '' + b, S)
    if (typeof b == 'object' && b !== null) {
      switch (b.$$typeof) {
        case Da:
          return (v = v.get(b.key === null ? p : b.key) || null), c(h, v, b, S)
        case Su:
          return (v = v.get(b.key === null ? p : b.key) || null), f(h, v, b, S)
        case an:
          var A = b._init
          return (b = A(b._payload)), s(v, h, p, b, S)
      }
      if (Tu(b) || du(b)) return (v = v.get(p) || null), o(h, v, b, S, null)
      if (typeof b.then == 'function') return s(v, h, p, La(b), S)
      if (b.$$typeof === Gt) return s(v, h, p, ja(h, b), S)
      Ua(h, b)
    }
    return null
  }
  function y(v, h, p, b) {
    for (var S = null, A = null, O = h, M = (h = 0), z = null; O !== null && M < p.length; M++) {
      O.index > M ? ((z = O), (O = null)) : (z = O.sibling)
      var _ = m(v, O, p[M], b)
      if (_ === null) {
        O === null && (O = z)
        break
      }
      e && O && _.alternate === null && t(v, O),
        (h = a(_, h, M)),
        A === null ? (S = _) : (A.sibling = _),
        (A = _),
        (O = z)
    }
    if (M === p.length) return n(v, O), F && qn(v, M), S
    if (O === null) {
      for (; M < p.length; M++)
        (O = g(v, p[M], b)),
          O !== null && ((h = a(O, h, M)), A === null ? (S = O) : (A.sibling = O), (A = O))
      return F && qn(v, M), S
    }
    for (O = l(O); M < p.length; M++)
      (z = s(O, v, M, p[M], b)),
        z !== null &&
          (e && z.alternate !== null && O.delete(z.key === null ? M : z.key),
          (h = a(z, h, M)),
          A === null ? (S = z) : (A.sibling = z),
          (A = z))
    return (
      e &&
        O.forEach(function (D) {
          return t(v, D)
        }),
      F && qn(v, M),
      S
    )
  }
  function E(v, h, p, b) {
    if (p == null) throw Error(T(151))
    for (
      var S = null, A = null, O = h, M = (h = 0), z = null, _ = p.next();
      O !== null && !_.done;
      M++, _ = p.next()
    ) {
      O.index > M ? ((z = O), (O = null)) : (z = O.sibling)
      var D = m(v, O, _.value, b)
      if (D === null) {
        O === null && (O = z)
        break
      }
      e && O && D.alternate === null && t(v, O),
        (h = a(D, h, M)),
        A === null ? (S = D) : (A.sibling = D),
        (A = D),
        (O = z)
    }
    if (_.done) return n(v, O), F && qn(v, M), S
    if (O === null) {
      for (; !_.done; M++, _ = p.next())
        (_ = g(v, _.value, b)),
          _ !== null && ((h = a(_, h, M)), A === null ? (S = _) : (A.sibling = _), (A = _))
      return F && qn(v, M), S
    }
    for (O = l(O); !_.done; M++, _ = p.next())
      (_ = s(O, v, M, _.value, b)),
        _ !== null &&
          (e && _.alternate !== null && O.delete(_.key === null ? M : _.key),
          (h = a(_, h, M)),
          A === null ? (S = _) : (A.sibling = _),
          (A = _))
    return (
      e &&
        O.forEach(function (k) {
          return t(v, k)
        }),
      F && qn(v, M),
      S
    )
  }
  function x(v, h, p, b) {
    if (
      (typeof p == 'object' &&
        p !== null &&
        p.type === El &&
        p.key === null &&
        (p = p.props.children),
      typeof p == 'object' && p !== null)
    ) {
      switch (p.$$typeof) {
        case Da:
          e: {
            for (var S = p.key; h !== null; ) {
              if (h.key === S) {
                if (((S = p.type), S === El)) {
                  if (h.tag === 7) {
                    n(v, h.sibling), (b = u(h, p.props.children)), (b.return = v), (v = b)
                    break e
                  }
                } else if (
                  h.elementType === S ||
                  (typeof S == 'object' && S !== null && S.$$typeof === an && cs(S) === h.type)
                ) {
                  n(v, h.sibling), (b = u(h, p.props)), vu(b, p), (b.return = v), (v = b)
                  break e
                }
                n(v, h)
                break
              } else t(v, h)
              h = h.sibling
            }
            p.type === El
              ? ((b = Fn(p.props.children, v.mode, b, p.key)), (b.return = v), (v = b))
              : ((b = ei(p.type, p.key, p.props, null, v.mode, b)),
                vu(b, p),
                (b.return = v),
                (v = b))
          }
          return i(v)
        case Su:
          e: {
            for (S = p.key; h !== null; ) {
              if (h.key === S)
                if (
                  h.tag === 4 &&
                  h.stateNode.containerInfo === p.containerInfo &&
                  h.stateNode.implementation === p.implementation
                ) {
                  n(v, h.sibling), (b = u(h, p.children || [])), (b.return = v), (v = b)
                  break e
                } else {
                  n(v, h)
                  break
                }
              else t(v, h)
              h = h.sibling
            }
            ;(b = Gr(p, v.mode, b)), (b.return = v), (v = b)
          }
          return i(v)
        case an:
          return (S = p._init), (p = S(p._payload)), x(v, h, p, b)
      }
      if (Tu(p)) return y(v, h, p, b)
      if (du(p)) {
        if (((S = du(p)), typeof S != 'function')) throw Error(T(150))
        return (p = S.call(p)), E(v, h, p, b)
      }
      if (typeof p.then == 'function') return x(v, h, La(p), b)
      if (p.$$typeof === Gt) return x(v, h, ja(v, p), b)
      Ua(v, p)
    }
    return (typeof p == 'string' && p !== '') || typeof p == 'number' || typeof p == 'bigint'
      ? ((p = '' + p),
        h !== null && h.tag === 6
          ? (n(v, h.sibling), (b = u(h, p)), (b.return = v), (v = b))
          : (n(v, h), (b = Yr(p, v.mode, b)), (b.return = v), (v = b)),
        i(v))
      : n(v, h)
  }
  return function (v, h, p, b) {
    try {
      Wu = 0
      var S = x(v, h, p, b)
      return (Hl = null), S
    } catch (O) {
      if (O === Cu) throw O
      var A = mt(29, O, null, v.mode)
      return (A.lanes = b), (A.return = v), A
    } finally {
    }
  }
}
var In = _m(!0),
  Cm = _m(!1),
  Ql = Nt(null),
  hi = Nt(0)
function fs(e, t) {
  ;(e = Pt), re(hi, e), re(Ql, t), (Pt = e | t.baseLanes)
}
function wc() {
  re(hi, Pt), re(Ql, Ql.current)
}
function Hf() {
  ;(Pt = hi.current), De(Ql), De(hi)
}
var gt = Nt(null),
  Mt = null
function fn(e) {
  var t = e.alternate
  re(Te, Te.current & 1),
    re(gt, e),
    Mt === null && (t === null || Ql.current !== null || t.memoizedState !== null) && (Mt = e)
}
function Nm(e) {
  if (e.tag === 22) {
    if ((re(Te, Te.current), re(gt, e), Mt === null)) {
      var t = e.alternate
      t !== null && t.memoizedState !== null && (Mt = e)
    }
  } else on()
}
function on() {
  re(Te, Te.current), re(gt, gt.current)
}
function Vt(e) {
  De(gt), Mt === e && (Mt = null), De(Te)
}
var Te = Nt(0)
function gi(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState
      if (n !== null && ((n = n.dehydrated), n === null || n.data === '$?' || n.data === '$!'))
        return t
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128) return t
    } else if (t.child !== null) {
      ;(t.child.return = t), (t = t.child)
      continue
    }
    if (t === e) break
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null
      t = t.return
    }
    ;(t.sibling.return = t.return), (t = t.sibling)
  }
  return null
}
var z0 =
    typeof AbortController < 'u'
      ? AbortController
      : function () {
          var e = [],
            t = (this.signal = {
              aborted: !1,
              addEventListener: function (n, l) {
                e.push(l)
              }
            })
          this.abort = function () {
            ;(t.aborted = !0),
              e.forEach(function (n) {
                return n()
              })
          }
        },
  H0 = we.unstable_scheduleCallback,
  L0 = we.unstable_NormalPriority,
  xe = {
    $$typeof: Gt,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  }
function Lf() {
  return { controller: new z0(), data: new Map(), refCount: 0 }
}
function ha(e) {
  e.refCount--,
    e.refCount === 0 &&
      H0(L0, function () {
        e.controller.abort()
      })
}
var zu = null,
  Ac = 0,
  Vl = 0,
  Ll = null
function U0(e, t) {
  if (zu === null) {
    var n = (zu = [])
    ;(Ac = 0),
      (Vl = uo()),
      (Ll = {
        status: 'pending',
        value: void 0,
        then: function (l) {
          n.push(l)
        }
      })
  }
  return Ac++, t.then(os, os), t
}
function os() {
  if (--Ac === 0 && zu !== null) {
    Ll !== null && (Ll.status = 'fulfilled')
    var e = zu
    ;(zu = null), (Vl = 0), (Ll = null)
    for (var t = 0; t < e.length; t++) (0, e[t])()
  }
}
function j0(e, t) {
  var n = [],
    l = {
      status: 'pending',
      value: null,
      reason: null,
      then: function (u) {
        n.push(u)
      }
    }
  return (
    e.then(
      function () {
        ;(l.status = 'fulfilled'), (l.value = t)
        for (var u = 0; u < n.length; u++) (0, n[u])(t)
      },
      function (u) {
        for (l.status = 'rejected', l.reason = u, u = 0; u < n.length; u++) (0, n[u])(void 0)
      }
    ),
    l
  )
}
var ss = B.S
B.S = function (e, t) {
  typeof t == 'object' && t !== null && typeof t.then == 'function' && U0(e, t),
    ss !== null && ss(e, t)
}
var kn = Nt(null)
function Uf() {
  var e = kn.current
  return e !== null ? e : te.pooledCache
}
function Ja(e, t) {
  t === null ? re(kn, kn.current) : re(kn, t.pool)
}
function zm() {
  var e = Uf()
  return e === null ? null : { parent: xe._currentValue, pool: e }
}
var An = 0,
  Y = null,
  W = null,
  pe = null,
  vi = !1,
  Ul = !1,
  el = !1,
  pi = 0,
  Pu = 0,
  jl = null,
  q0 = 0
function me() {
  throw Error(T(321))
}
function jf(e, t) {
  if (t === null) return !1
  for (var n = 0; n < t.length && n < e.length; n++) if (!lt(e[n], t[n])) return !1
  return !0
}
function qf(e, t, n, l, u, a) {
  return (
    (An = a),
    (Y = t),
    (t.memoizedState = null),
    (t.updateQueue = null),
    (t.lanes = 0),
    (B.H = e === null || e.memoizedState === null ? ol : Nn),
    (el = !1),
    (a = n(l, u)),
    (el = !1),
    Ul && (a = Lm(t, n, l, u)),
    Hm(e),
    a
  )
}
function Hm(e) {
  B.H = _t
  var t = W !== null && W.next !== null
  if (((An = 0), (pe = W = Y = null), (vi = !1), (Pu = 0), (jl = null), t)) throw Error(T(300))
  e === null || Me || ((e = e.dependencies), e !== null && Ei(e) && (Me = !0))
}
function Lm(e, t, n, l) {
  Y = e
  var u = 0
  do {
    if ((Ul && (jl = null), (Pu = 0), (Ul = !1), 25 <= u)) throw Error(T(301))
    if (((u += 1), (pe = W = null), e.updateQueue != null)) {
      var a = e.updateQueue
      ;(a.lastEffect = null),
        (a.events = null),
        (a.stores = null),
        a.memoCache != null && (a.memoCache.index = 0)
    }
    ;(B.H = sl), (a = t(n, l))
  } while (Ul)
  return a
}
function B0() {
  var e = B.H,
    t = e.useState()[0]
  return (
    (t = typeof t.then == 'function' ? ga(t) : t),
    (e = e.useState()[0]),
    (W !== null ? W.memoizedState : null) !== e && (Y.flags |= 1024),
    t
  )
}
function Bf() {
  var e = pi !== 0
  return (pi = 0), e
}
function $f(e, t, n) {
  ;(t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~n)
}
function Yf(e) {
  if (vi) {
    for (e = e.memoizedState; e !== null; ) {
      var t = e.queue
      t !== null && (t.pending = null), (e = e.next)
    }
    vi = !1
  }
  ;(An = 0), (pe = W = Y = null), (Ul = !1), (Pu = pi = 0), (jl = null)
}
function Ve() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null }
  return pe === null ? (Y.memoizedState = pe = e) : (pe = pe.next = e), pe
}
function ye() {
  if (W === null) {
    var e = Y.alternate
    e = e !== null ? e.memoizedState : null
  } else e = W.next
  var t = pe === null ? Y.memoizedState : pe.next
  if (t !== null) (pe = t), (W = e)
  else {
    if (e === null) throw Y.alternate === null ? Error(T(467)) : Error(T(310))
    ;(W = e),
      (e = {
        memoizedState: W.memoizedState,
        baseState: W.baseState,
        baseQueue: W.baseQueue,
        queue: W.queue,
        next: null
      }),
      pe === null ? (Y.memoizedState = pe = e) : (pe = pe.next = e)
  }
  return pe
}
var Fi
Fi = function () {
  return { lastEffect: null, events: null, stores: null, memoCache: null }
}
function ga(e) {
  var t = Pu
  return (
    (Pu += 1),
    jl === null && (jl = []),
    (e = Dm(jl, e, t)),
    (t = Y),
    (pe === null ? t.memoizedState : pe.next) === null &&
      ((t = t.alternate), (B.H = t === null || t.memoizedState === null ? ol : Nn)),
    e
  )
}
function Ki(e) {
  if (e !== null && typeof e == 'object') {
    if (typeof e.then == 'function') return ga(e)
    if (e.$$typeof === Gt) return qe(e)
  }
  throw Error(T(438, String(e)))
}
function Gf(e) {
  var t = null,
    n = Y.updateQueue
  if ((n !== null && (t = n.memoCache), t == null)) {
    var l = Y.alternate
    l !== null &&
      ((l = l.updateQueue),
      l !== null &&
        ((l = l.memoCache),
        l != null &&
          (t = {
            data: l.data.map(function (u) {
              return u.slice()
            }),
            index: 0
          })))
  }
  if (
    (t == null && (t = { data: [], index: 0 }),
    n === null && ((n = Fi()), (Y.updateQueue = n)),
    (n.memoCache = t),
    (n = t.data[t.index]),
    n === void 0)
  )
    for (n = t.data[t.index] = Array(e), l = 0; l < e; l++) n[l] = Sp
  return t.index++, n
}
function Jt(e, t) {
  return typeof t == 'function' ? t(e) : t
}
function Wa(e) {
  var t = ye()
  return Xf(t, W, e)
}
function Xf(e, t, n) {
  var l = e.queue
  if (l === null) throw Error(T(311))
  l.lastRenderedReducer = n
  var u = e.baseQueue,
    a = l.pending
  if (a !== null) {
    if (u !== null) {
      var i = u.next
      ;(u.next = a.next), (a.next = i)
    }
    ;(t.baseQueue = u = a), (l.pending = null)
  }
  if (((a = e.baseState), u === null)) e.memoizedState = a
  else {
    t = u.next
    var r = (i = null),
      c = null,
      f = t,
      o = !1
    do {
      var g = f.lane & -536870913
      if (g !== f.lane ? (Z & g) === g : (An & g) === g) {
        var m = f.revertLane
        if (m === 0)
          c !== null &&
            (c = c.next =
              {
                lane: 0,
                revertLane: 0,
                action: f.action,
                hasEagerState: f.hasEagerState,
                eagerState: f.eagerState,
                next: null
              }),
            g === Vl && (o = !0)
        else if ((An & m) === m) {
          ;(f = f.next), m === Vl && (o = !0)
          continue
        } else
          (g = {
            lane: 0,
            revertLane: f.revertLane,
            action: f.action,
            hasEagerState: f.hasEagerState,
            eagerState: f.eagerState,
            next: null
          }),
            c === null ? ((r = c = g), (i = a)) : (c = c.next = g),
            (Y.lanes |= m),
            (Mn |= m)
        ;(g = f.action), el && n(a, g), (a = f.hasEagerState ? f.eagerState : n(a, g))
      } else
        (m = {
          lane: g,
          revertLane: f.revertLane,
          action: f.action,
          hasEagerState: f.hasEagerState,
          eagerState: f.eagerState,
          next: null
        }),
          c === null ? ((r = c = m), (i = a)) : (c = c.next = m),
          (Y.lanes |= g),
          (Mn |= g)
      f = f.next
    } while (f !== null && f !== t)
    if (
      (c === null ? (i = a) : (c.next = r),
      !lt(a, e.memoizedState) && ((Me = !0), o && ((n = Ll), n !== null)))
    )
      throw n
    ;(e.memoizedState = a), (e.baseState = i), (e.baseQueue = c), (l.lastRenderedState = a)
  }
  return u === null && (l.lanes = 0), [e.memoizedState, l.dispatch]
}
function _r(e) {
  var t = ye(),
    n = t.queue
  if (n === null) throw Error(T(311))
  n.lastRenderedReducer = e
  var l = n.dispatch,
    u = n.pending,
    a = t.memoizedState
  if (u !== null) {
    n.pending = null
    var i = (u = u.next)
    do (a = e(a, i.action)), (i = i.next)
    while (i !== u)
    lt(a, t.memoizedState) || (Me = !0),
      (t.memoizedState = a),
      t.baseQueue === null && (t.baseState = a),
      (n.lastRenderedState = a)
  }
  return [a, l]
}
function Um(e, t, n) {
  var l = Y,
    u = ye(),
    a = F
  if (a) {
    if (n === void 0) throw Error(T(407))
    n = n()
  } else n = t()
  var i = !lt((W || u).memoizedState, n)
  if (
    (i && ((u.memoizedState = n), (Me = !0)),
    (u = u.queue),
    Qf(Bm.bind(null, l, u, e), [e]),
    u.getSnapshot !== t || i || (pe !== null && pe.memoizedState.tag & 1))
  ) {
    if (
      ((l.flags |= 2048), Zl(9, qm.bind(null, l, u, n, t), { destroy: void 0 }, null), te === null)
    )
      throw Error(T(349))
    a || An & 60 || jm(l, t, n)
  }
  return n
}
function jm(e, t, n) {
  ;(e.flags |= 16384),
    (e = { getSnapshot: t, value: n }),
    (t = Y.updateQueue),
    t === null
      ? ((t = Fi()), (Y.updateQueue = t), (t.stores = [e]))
      : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e))
}
function qm(e, t, n, l) {
  ;(t.value = n), (t.getSnapshot = l), $m(t) && Ym(e)
}
function Bm(e, t, n) {
  return n(function () {
    $m(t) && Ym(e)
  })
}
function $m(e) {
  var t = e.getSnapshot
  e = e.value
  try {
    var n = t()
    return !lt(e, n)
  } catch {
    return !0
  }
}
function Ym(e) {
  var t = wn(e, 2)
  t !== null && Xe(t, e, 2)
}
function Rc(e) {
  var t = Ve()
  if (typeof e == 'function') {
    var n = e
    if (((e = n()), el)) {
      hn(!0)
      try {
        n()
      } finally {
        hn(!1)
      }
    }
  }
  return (
    (t.memoizedState = t.baseState = e),
    (t.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Jt,
      lastRenderedState: e
    }),
    t
  )
}
function Gm(e, t, n, l) {
  return (e.baseState = n), Xf(e, W, typeof l == 'function' ? l : Jt)
}
function $0(e, t, n, l, u) {
  if (Wi(e)) throw Error(T(485))
  if (((e = t.action), e !== null)) {
    var a = {
      payload: u,
      action: e,
      next: null,
      isTransition: !0,
      status: 'pending',
      value: null,
      reason: null,
      listeners: [],
      then: function (i) {
        a.listeners.push(i)
      }
    }
    B.T !== null ? n(!0) : (a.isTransition = !1),
      l(a),
      (n = t.pending),
      n === null
        ? ((a.next = t.pending = a), Xm(t, a))
        : ((a.next = n.next), (t.pending = n.next = a))
  }
}
function Xm(e, t) {
  var n = t.action,
    l = t.payload,
    u = e.state
  if (t.isTransition) {
    var a = B.T,
      i = {}
    B.T = i
    try {
      var r = n(u, l),
        c = B.S
      c !== null && c(i, r), ds(e, t, r)
    } catch (f) {
      Mc(e, t, f)
    } finally {
      B.T = a
    }
  } else
    try {
      ;(a = n(u, l)), ds(e, t, a)
    } catch (f) {
      Mc(e, t, f)
    }
}
function ds(e, t, n) {
  n !== null && typeof n == 'object' && typeof n.then == 'function'
    ? n.then(
        function (l) {
          ms(e, t, l)
        },
        function (l) {
          return Mc(e, t, l)
        }
      )
    : ms(e, t, n)
}
function ms(e, t, n) {
  ;(t.status = 'fulfilled'),
    (t.value = n),
    Qm(t),
    (e.state = n),
    (t = e.pending),
    t !== null &&
      ((n = t.next), n === t ? (e.pending = null) : ((n = n.next), (t.next = n), Xm(e, n)))
}
function Mc(e, t, n) {
  var l = e.pending
  if (((e.pending = null), l !== null)) {
    l = l.next
    do (t.status = 'rejected'), (t.reason = n), Qm(t), (t = t.next)
    while (t !== l)
  }
  e.action = null
}
function Qm(e) {
  e = e.listeners
  for (var t = 0; t < e.length; t++) (0, e[t])()
}
function Vm(e, t) {
  return t
}
function Zm(e, t) {
  if (F) {
    var n = te.formState
    if (n !== null) {
      e: {
        var l = Y
        if (F) {
          if (Ne) {
            t: {
              for (var u = Ne, a = Ot; u.nodeType !== 8; ) {
                if (!a) {
                  u = null
                  break t
                }
                if (((u = Et(u.nextSibling)), u === null)) {
                  u = null
                  break t
                }
              }
              ;(a = u.data), (u = a === 'F!' || a === 'F' ? u : null)
            }
            if (u) {
              ;(Ne = Et(u.nextSibling)), (l = u.data === 'F!')
              break e
            }
          }
          Pn(l)
        }
        l = !1
      }
      l && (t = n[0])
    }
  }
  return (
    (n = Ve()),
    (n.memoizedState = n.baseState = t),
    (l = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Vm,
      lastRenderedState: t
    }),
    (n.queue = l),
    (n = fh.bind(null, Y, l)),
    (l.dispatch = n),
    (l = Rc(!1)),
    (a = Ff.bind(null, Y, !1, l.queue)),
    (l = Ve()),
    (u = { state: t, dispatch: null, action: e, pending: null }),
    (l.queue = u),
    (n = $0.bind(null, Y, u, a, n)),
    (u.dispatch = n),
    (l.memoizedState = e),
    [t, n, !1]
  )
}
function km(e) {
  var t = ye()
  return Fm(t, W, e)
}
function Fm(e, t, n) {
  ;(t = Xf(e, t, Vm)[0]),
    (e = Wa(Jt)[0]),
    (t = typeof t == 'object' && t !== null && typeof t.then == 'function' ? ga(t) : t)
  var l = ye(),
    u = l.queue,
    a = u.dispatch
  return (
    n !== l.memoizedState &&
      ((Y.flags |= 2048), Zl(9, Y0.bind(null, u, n), { destroy: void 0 }, null)),
    [t, a, e]
  )
}
function Y0(e, t) {
  e.action = t
}
function Km(e) {
  var t = ye(),
    n = W
  if (n !== null) return Fm(t, n, e)
  ye(), (t = t.memoizedState), (n = ye())
  var l = n.queue.dispatch
  return (n.memoizedState = e), [t, l, !1]
}
function Zl(e, t, n, l) {
  return (
    (e = { tag: e, create: t, inst: n, deps: l, next: null }),
    (t = Y.updateQueue),
    t === null && ((t = Fi()), (Y.updateQueue = t)),
    (n = t.lastEffect),
    n === null
      ? (t.lastEffect = e.next = e)
      : ((l = n.next), (n.next = e), (e.next = l), (t.lastEffect = e)),
    e
  )
}
function Jm() {
  return ye().memoizedState
}
function Pa(e, t, n, l) {
  var u = Ve()
  ;(Y.flags |= e), (u.memoizedState = Zl(1 | t, n, { destroy: void 0 }, l === void 0 ? null : l))
}
function Ji(e, t, n, l) {
  var u = ye()
  l = l === void 0 ? null : l
  var a = u.memoizedState.inst
  W !== null && l !== null && jf(l, W.memoizedState.deps)
    ? (u.memoizedState = Zl(t, n, a, l))
    : ((Y.flags |= e), (u.memoizedState = Zl(1 | t, n, a, l)))
}
function hs(e, t) {
  Pa(8390656, 8, e, t)
}
function Qf(e, t) {
  Ji(2048, 8, e, t)
}
function Wm(e, t) {
  return Ji(4, 2, e, t)
}
function Pm(e, t) {
  return Ji(4, 4, e, t)
}
function Im(e, t) {
  if (typeof t == 'function') {
    e = e()
    var n = t(e)
    return function () {
      typeof n == 'function' ? n() : t(null)
    }
  }
  if (t != null)
    return (
      (e = e()),
      (t.current = e),
      function () {
        t.current = null
      }
    )
}
function eh(e, t, n) {
  ;(n = n != null ? n.concat([e]) : null), Ji(4, 4, Im.bind(null, t, e), n)
}
function Vf() {}
function th(e, t) {
  var n = ye()
  t = t === void 0 ? null : t
  var l = n.memoizedState
  return t !== null && jf(t, l[1]) ? l[0] : ((n.memoizedState = [e, t]), e)
}
function nh(e, t) {
  var n = ye()
  t = t === void 0 ? null : t
  var l = n.memoizedState
  if (t !== null && jf(t, l[1])) return l[0]
  if (((l = e()), el)) {
    hn(!0)
    try {
      e()
    } finally {
      hn(!1)
    }
  }
  return (n.memoizedState = [l, t]), l
}
function Zf(e, t, n) {
  return n === void 0 || An & 1073741824
    ? (e.memoizedState = t)
    : ((e.memoizedState = n), (e = Qh()), (Y.lanes |= e), (Mn |= e), n)
}
function lh(e, t, n, l) {
  return lt(n, t)
    ? n
    : Ql.current !== null
    ? ((e = Zf(e, n, l)), lt(e, t) || (Me = !0), e)
    : An & 42
    ? ((e = Qh()), (Y.lanes |= e), (Mn |= e), t)
    : ((Me = !0), (e.memoizedState = n))
}
function uh(e, t, n, l, u) {
  var a = ne.p
  ne.p = a !== 0 && 8 > a ? a : 8
  var i = B.T,
    r = {}
  ;(B.T = r), Ff(e, !1, t, n)
  try {
    var c = u(),
      f = B.S
    if (
      (f !== null && f(r, c), c !== null && typeof c == 'object' && typeof c.then == 'function')
    ) {
      var o = j0(c, l)
      Hu(e, t, o, tt(e))
    } else Hu(e, t, l, tt(e))
  } catch (g) {
    Hu(e, t, { then: function () {}, status: 'rejected', reason: g }, tt())
  } finally {
    ;(ne.p = a), (B.T = i)
  }
}
function G0() {}
function Dc(e, t, n, l) {
  if (e.tag !== 5) throw Error(T(476))
  var u = ah(e).queue
  uh(
    e,
    u,
    t,
    Vn,
    n === null
      ? G0
      : function () {
          return ih(e), n(l)
        }
  )
}
function ah(e) {
  var t = e.memoizedState
  if (t !== null) return t
  t = {
    memoizedState: Vn,
    baseState: Vn,
    baseQueue: null,
    queue: {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: Jt,
      lastRenderedState: Vn
    },
    next: null
  }
  var n = {}
  return (
    (t.next = {
      memoizedState: n,
      baseState: n,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Jt,
        lastRenderedState: n
      },
      next: null
    }),
    (e.memoizedState = t),
    (e = e.alternate),
    e !== null && (e.memoizedState = t),
    t
  )
}
function ih(e) {
  var t = ah(e).next.queue
  Hu(e, t, {}, tt())
}
function kf() {
  return qe(na)
}
function rh() {
  return ye().memoizedState
}
function ch() {
  return ye().memoizedState
}
function X0(e) {
  for (var t = e.return; t !== null; ) {
    switch (t.tag) {
      case 24:
      case 3:
        var n = tt()
        e = yn(n)
        var l = bn(t, e, n)
        l !== null && (Xe(l, t, n), Uu(l, t, n)), (t = { cache: Lf() }), (e.payload = t)
        return
    }
    t = t.return
  }
}
function Q0(e, t, n) {
  var l = tt()
  ;(n = { lane: l, revertLane: 0, action: n, hasEagerState: !1, eagerState: null, next: null }),
    Wi(e) ? oh(t, n) : ((n = Cf(e, t, n, l)), n !== null && (Xe(n, e, l), sh(n, t, l)))
}
function fh(e, t, n) {
  var l = tt()
  Hu(e, t, n, l)
}
function Hu(e, t, n, l) {
  var u = { lane: l, revertLane: 0, action: n, hasEagerState: !1, eagerState: null, next: null }
  if (Wi(e)) oh(t, u)
  else {
    var a = e.alternate
    if (e.lanes === 0 && (a === null || a.lanes === 0) && ((a = t.lastRenderedReducer), a !== null))
      try {
        var i = t.lastRenderedState,
          r = a(i, n)
        if (((u.hasEagerState = !0), (u.eagerState = r), lt(r, i)))
          return ki(e, t, u, 0), te === null && Zi(), !1
      } catch {
      } finally {
      }
    if (((n = Cf(e, t, u, l)), n !== null)) return Xe(n, e, l), sh(n, t, l), !0
  }
  return !1
}
function Ff(e, t, n, l) {
  if (
    ((l = {
      lane: 2,
      revertLane: uo(),
      action: l,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }),
    Wi(e))
  ) {
    if (t) throw Error(T(479))
  } else (t = Cf(e, n, l, 2)), t !== null && Xe(t, e, 2)
}
function Wi(e) {
  var t = e.alternate
  return e === Y || (t !== null && t === Y)
}
function oh(e, t) {
  Ul = vi = !0
  var n = e.pending
  n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t)
}
function sh(e, t, n) {
  if (n & 4194176) {
    var l = t.lanes
    ;(l &= e.pendingLanes), (n |= l), (t.lanes = n), Id(e, n)
  }
}
var _t = {
  readContext: qe,
  use: Ki,
  useCallback: me,
  useContext: me,
  useEffect: me,
  useImperativeHandle: me,
  useLayoutEffect: me,
  useInsertionEffect: me,
  useMemo: me,
  useReducer: me,
  useRef: me,
  useState: me,
  useDebugValue: me,
  useDeferredValue: me,
  useTransition: me,
  useSyncExternalStore: me,
  useId: me
}
_t.useCacheRefresh = me
_t.useMemoCache = me
_t.useHostTransitionStatus = me
_t.useFormState = me
_t.useActionState = me
_t.useOptimistic = me
var ol = {
  readContext: qe,
  use: Ki,
  useCallback: function (e, t) {
    return (Ve().memoizedState = [e, t === void 0 ? null : t]), e
  },
  useContext: qe,
  useEffect: hs,
  useImperativeHandle: function (e, t, n) {
    ;(n = n != null ? n.concat([e]) : null), Pa(4194308, 4, Im.bind(null, t, e), n)
  },
  useLayoutEffect: function (e, t) {
    return Pa(4194308, 4, e, t)
  },
  useInsertionEffect: function (e, t) {
    Pa(4, 2, e, t)
  },
  useMemo: function (e, t) {
    var n = Ve()
    t = t === void 0 ? null : t
    var l = e()
    if (el) {
      hn(!0)
      try {
        e()
      } finally {
        hn(!1)
      }
    }
    return (n.memoizedState = [l, t]), l
  },
  useReducer: function (e, t, n) {
    var l = Ve()
    if (n !== void 0) {
      var u = n(t)
      if (el) {
        hn(!0)
        try {
          n(t)
        } finally {
          hn(!1)
        }
      }
    } else u = t
    return (
      (l.memoizedState = l.baseState = u),
      (e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: e,
        lastRenderedState: u
      }),
      (l.queue = e),
      (e = e.dispatch = Q0.bind(null, Y, e)),
      [l.memoizedState, e]
    )
  },
  useRef: function (e) {
    var t = Ve()
    return (e = { current: e }), (t.memoizedState = e)
  },
  useState: function (e) {
    e = Rc(e)
    var t = e.queue,
      n = fh.bind(null, Y, t)
    return (t.dispatch = n), [e.memoizedState, n]
  },
  useDebugValue: Vf,
  useDeferredValue: function (e, t) {
    var n = Ve()
    return Zf(n, e, t)
  },
  useTransition: function () {
    var e = Rc(!1)
    return (e = uh.bind(null, Y, e.queue, !0, !1)), (Ve().memoizedState = e), [!1, e]
  },
  useSyncExternalStore: function (e, t, n) {
    var l = Y,
      u = Ve()
    if (F) {
      if (n === void 0) throw Error(T(407))
      n = n()
    } else {
      if (((n = t()), te === null)) throw Error(T(349))
      Z & 60 || jm(l, t, n)
    }
    u.memoizedState = n
    var a = { value: n, getSnapshot: t }
    return (
      (u.queue = a),
      hs(Bm.bind(null, l, a, e), [e]),
      (l.flags |= 2048),
      Zl(9, qm.bind(null, l, a, n, t), { destroy: void 0 }, null),
      n
    )
  },
  useId: function () {
    var e = Ve(),
      t = te.identifierPrefix
    if (F) {
      var n = Qt,
        l = Xt
      ;(n = (l & ~(1 << (32 - et(l) - 1))).toString(32) + n),
        (t = ':' + t + 'R' + n),
        (n = pi++),
        0 < n && (t += 'H' + n.toString(32)),
        (t += ':')
    } else (n = q0++), (t = ':' + t + 'r' + n.toString(32) + ':')
    return (e.memoizedState = t)
  },
  useCacheRefresh: function () {
    return (Ve().memoizedState = X0.bind(null, Y))
  }
}
ol.useMemoCache = Gf
ol.useHostTransitionStatus = kf
ol.useFormState = Zm
ol.useActionState = Zm
ol.useOptimistic = function (e) {
  var t = Ve()
  t.memoizedState = t.baseState = e
  var n = {
    pending: null,
    lanes: 0,
    dispatch: null,
    lastRenderedReducer: null,
    lastRenderedState: null
  }
  return (t.queue = n), (t = Ff.bind(null, Y, !0, n)), (n.dispatch = t), [e, t]
}
var Nn = {
  readContext: qe,
  use: Ki,
  useCallback: th,
  useContext: qe,
  useEffect: Qf,
  useImperativeHandle: eh,
  useInsertionEffect: Wm,
  useLayoutEffect: Pm,
  useMemo: nh,
  useReducer: Wa,
  useRef: Jm,
  useState: function () {
    return Wa(Jt)
  },
  useDebugValue: Vf,
  useDeferredValue: function (e, t) {
    var n = ye()
    return lh(n, W.memoizedState, e, t)
  },
  useTransition: function () {
    var e = Wa(Jt)[0],
      t = ye().memoizedState
    return [typeof e == 'boolean' ? e : ga(e), t]
  },
  useSyncExternalStore: Um,
  useId: rh
}
Nn.useCacheRefresh = ch
Nn.useMemoCache = Gf
Nn.useHostTransitionStatus = kf
Nn.useFormState = km
Nn.useActionState = km
Nn.useOptimistic = function (e, t) {
  var n = ye()
  return Gm(n, W, e, t)
}
var sl = {
  readContext: qe,
  use: Ki,
  useCallback: th,
  useContext: qe,
  useEffect: Qf,
  useImperativeHandle: eh,
  useInsertionEffect: Wm,
  useLayoutEffect: Pm,
  useMemo: nh,
  useReducer: _r,
  useRef: Jm,
  useState: function () {
    return _r(Jt)
  },
  useDebugValue: Vf,
  useDeferredValue: function (e, t) {
    var n = ye()
    return W === null ? Zf(n, e, t) : lh(n, W.memoizedState, e, t)
  },
  useTransition: function () {
    var e = _r(Jt)[0],
      t = ye().memoizedState
    return [typeof e == 'boolean' ? e : ga(e), t]
  },
  useSyncExternalStore: Um,
  useId: rh
}
sl.useCacheRefresh = ch
sl.useMemoCache = Gf
sl.useHostTransitionStatus = kf
sl.useFormState = Km
sl.useActionState = Km
sl.useOptimistic = function (e, t) {
  var n = ye()
  return W !== null ? Gm(n, W, e, t) : ((n.baseState = e), [e, n.queue.dispatch])
}
function Cr(e, t, n, l) {
  ;(t = e.memoizedState),
    (n = n(l, t)),
    (n = n == null ? t : ue({}, t, n)),
    (e.memoizedState = n),
    e.lanes === 0 && (e.updateQueue.baseState = n)
}
var _c = {
  isMounted: function (e) {
    return (e = e._reactInternals) ? eu(e) === e : !1
  },
  enqueueSetState: function (e, t, n) {
    e = e._reactInternals
    var l = tt(),
      u = yn(l)
    ;(u.payload = t),
      n != null && (u.callback = n),
      (t = bn(e, u, l)),
      t !== null && (Xe(t, e, l), Uu(t, e, l))
  },
  enqueueReplaceState: function (e, t, n) {
    e = e._reactInternals
    var l = tt(),
      u = yn(l)
    ;(u.tag = 1),
      (u.payload = t),
      n != null && (u.callback = n),
      (t = bn(e, u, l)),
      t !== null && (Xe(t, e, l), Uu(t, e, l))
  },
  enqueueForceUpdate: function (e, t) {
    e = e._reactInternals
    var n = tt(),
      l = yn(n)
    ;(l.tag = 2),
      t != null && (l.callback = t),
      (t = bn(e, l, n)),
      t !== null && (Xe(t, e, n), Uu(t, e, n))
  }
}
function gs(e, t, n, l, u, a, i) {
  return (
    (e = e.stateNode),
    typeof e.shouldComponentUpdate == 'function'
      ? e.shouldComponentUpdate(l, a, i)
      : t.prototype && t.prototype.isPureReactComponent
      ? !Ku(n, l) || !Ku(u, a)
      : !0
  )
}
function vs(e, t, n, l) {
  ;(e = t.state),
    typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(n, l),
    typeof t.UNSAFE_componentWillReceiveProps == 'function' &&
      t.UNSAFE_componentWillReceiveProps(n, l),
    t.state !== e && _c.enqueueReplaceState(t, t.state, null)
}
function tl(e, t) {
  var n = t
  if ('ref' in t) {
    n = {}
    for (var l in t) l !== 'ref' && (n[l] = t[l])
  }
  if ((e = e.defaultProps)) {
    n === t && (n = ue({}, n))
    for (var u in e) n[u] === void 0 && (n[u] = e[u])
  }
  return n
}
var yi =
  typeof reportError == 'function'
    ? reportError
    : function (e) {
        if (typeof window == 'object' && typeof window.ErrorEvent == 'function') {
          var t = new window.ErrorEvent('error', {
            bubbles: !0,
            cancelable: !0,
            message:
              typeof e == 'object' && e !== null && typeof e.message == 'string'
                ? String(e.message)
                : String(e),
            error: e
          })
          if (!window.dispatchEvent(t)) return
        } else if (typeof process == 'object' && typeof process.emit == 'function') {
          process.emit('uncaughtException', e)
          return
        }
      }
function dh(e) {
  yi(e)
}
function mh(e) {}
function hh(e) {
  yi(e)
}
function bi(e, t) {
  try {
    var n = e.onUncaughtError
    n(t.value, { componentStack: t.stack })
  } catch (l) {
    setTimeout(function () {
      throw l
    })
  }
}
function ps(e, t, n) {
  try {
    var l = e.onCaughtError
    l(n.value, { componentStack: n.stack, errorBoundary: t.tag === 1 ? t.stateNode : null })
  } catch (u) {
    setTimeout(function () {
      throw u
    })
  }
}
function Cc(e, t, n) {
  return (
    (n = yn(n)),
    (n.tag = 3),
    (n.payload = { element: null }),
    (n.callback = function () {
      bi(e, t)
    }),
    n
  )
}
function gh(e) {
  return (e = yn(e)), (e.tag = 3), e
}
function vh(e, t, n, l) {
  var u = n.type.getDerivedStateFromError
  if (typeof u == 'function') {
    var a = l.value
    ;(e.payload = function () {
      return u(a)
    }),
      (e.callback = function () {
        ps(t, n, l)
      })
  }
  var i = n.stateNode
  i !== null &&
    typeof i.componentDidCatch == 'function' &&
    (e.callback = function () {
      ps(t, n, l), typeof u != 'function' && (Sn === null ? (Sn = new Set([this])) : Sn.add(this))
      var r = l.stack
      this.componentDidCatch(l.value, { componentStack: r !== null ? r : '' })
    })
}
function V0(e, t, n, l, u) {
  if (((n.flags |= 32768), l !== null && typeof l == 'object' && typeof l.then == 'function')) {
    if (((t = n.alternate), t !== null && va(t, n, u, !0), (n = gt.current), n !== null)) {
      switch (n.tag) {
        case 13:
          return (
            Mt === null ? Zc() : n.alternate === null && de === 0 && (de = 3),
            (n.flags &= -257),
            (n.flags |= 65536),
            (n.lanes = u),
            l === Oc
              ? (n.flags |= 16384)
              : ((t = n.updateQueue),
                t === null ? (n.updateQueue = new Set([l])) : t.add(l),
                Qr(e, l, u)),
            !1
          )
        case 22:
          return (
            (n.flags |= 65536),
            l === Oc
              ? (n.flags |= 16384)
              : ((t = n.updateQueue),
                t === null
                  ? ((t = { transitions: null, markerInstances: null, retryQueue: new Set([l]) }),
                    (n.updateQueue = t))
                  : ((n = t.retryQueue), n === null ? (t.retryQueue = new Set([l])) : n.add(l)),
                Qr(e, l, u)),
            !1
          )
      }
      throw Error(T(435, n.tag))
    }
    return Qr(e, l, u), Zc(), !1
  }
  if (F)
    return (
      (t = gt.current),
      t !== null
        ? (!(t.flags & 65536) && (t.flags |= 256),
          (t.flags |= 65536),
          (t.lanes = u),
          l !== Tc && ((e = Error(T(422), { cause: l })), Ju(dt(e, n))))
        : (l !== Tc && ((t = Error(T(423), { cause: l })), Ju(dt(t, n))),
          (e = e.current.alternate),
          (e.flags |= 65536),
          (u &= -u),
          (e.lanes |= u),
          (l = dt(l, n)),
          (u = Cc(e.stateNode, l, u)),
          jr(e, u),
          de !== 4 && (de = 2)),
      !1
    )
  var a = Error(T(520), { cause: l })
  if (((a = dt(a, n)), $u === null ? ($u = [a]) : $u.push(a), de !== 4 && (de = 2), t === null))
    return !0
  ;(l = dt(l, n)), (n = t)
  do {
    switch (n.tag) {
      case 3:
        return (
          (n.flags |= 65536),
          (e = u & -u),
          (n.lanes |= e),
          (e = Cc(n.stateNode, l, e)),
          jr(n, e),
          !1
        )
      case 1:
        if (
          ((t = n.type),
          (a = n.stateNode),
          (n.flags & 128) === 0 &&
            (typeof t.getDerivedStateFromError == 'function' ||
              (a !== null &&
                typeof a.componentDidCatch == 'function' &&
                (Sn === null || !Sn.has(a)))))
        )
          return (
            (n.flags |= 65536), (u &= -u), (n.lanes |= u), (u = gh(u)), vh(u, e, n, l), jr(n, u), !1
          )
    }
    n = n.return
  } while (n !== null)
  return !1
}
var ph = Error(T(461)),
  Me = !1
function Ce(e, t, n, l) {
  t.child = e === null ? Cm(t, null, n, l) : In(t, e.child, n, l)
}
function ys(e, t, n, l, u) {
  n = n.render
  var a = t.ref
  if ('ref' in l) {
    var i = {}
    for (var r in l) r !== 'ref' && (i[r] = l[r])
  } else i = l
  return (
    nl(t),
    (l = qf(e, t, n, i, a, u)),
    (r = Bf()),
    e !== null && !Me
      ? ($f(e, t, u), Wt(e, t, u))
      : (F && r && Nf(t), (t.flags |= 1), Ce(e, t, l, u), t.child)
  )
}
function bs(e, t, n, l, u) {
  if (e === null) {
    var a = n.type
    return typeof a == 'function' && !If(a) && a.defaultProps === void 0 && n.compare === null
      ? ((t.tag = 15), (t.type = a), yh(e, t, a, l, u))
      : ((e = ei(n.type, null, l, t, t.mode, u)), (e.ref = t.ref), (e.return = t), (t.child = e))
  }
  if (((a = e.child), !Kf(e, u))) {
    var i = a.memoizedProps
    if (((n = n.compare), (n = n !== null ? n : Ku), n(i, l) && e.ref === t.ref)) return Wt(e, t, u)
  }
  return (t.flags |= 1), (e = En(a, l)), (e.ref = t.ref), (e.return = t), (t.child = e)
}
function yh(e, t, n, l, u) {
  if (e !== null) {
    var a = e.memoizedProps
    if (Ku(a, l) && e.ref === t.ref)
      if (((Me = !1), (t.pendingProps = l = a), Kf(e, u))) e.flags & 131072 && (Me = !0)
      else return (t.lanes = e.lanes), Wt(e, t, u)
  }
  return Nc(e, t, n, l, u)
}
function bh(e, t, n) {
  var l = t.pendingProps,
    u = l.children,
    a = (t.stateNode._pendingVisibility & 2) !== 0,
    i = e !== null ? e.memoizedState : null
  if ((Lu(e, t), l.mode === 'hidden' || a)) {
    if (t.flags & 128) {
      if (((l = i !== null ? i.baseLanes | n : n), e !== null)) {
        for (u = t.child = e.child, a = 0; u !== null; )
          (a = a | u.lanes | u.childLanes), (u = u.sibling)
        t.childLanes = a & ~l
      } else (t.childLanes = 0), (t.child = null)
      return Es(e, t, l, n)
    }
    if (n & 536870912)
      (t.memoizedState = { baseLanes: 0, cachePool: null }),
        e !== null && Ja(t, i !== null ? i.cachePool : null),
        i !== null ? fs(t, i) : wc(),
        Nm(t)
    else return (t.lanes = t.childLanes = 536870912), Es(e, t, i !== null ? i.baseLanes | n : n, n)
  } else
    i !== null
      ? (Ja(t, i.cachePool), fs(t, i), on(), (t.memoizedState = null))
      : (e !== null && Ja(t, null), wc(), on())
  return Ce(e, t, u, n), t.child
}
function Es(e, t, n, l) {
  var u = Uf()
  return (
    (u = u === null ? null : { parent: xe._currentValue, pool: u }),
    (t.memoizedState = { baseLanes: n, cachePool: u }),
    e !== null && Ja(t, null),
    wc(),
    Nm(t),
    e !== null && va(e, t, l, !0),
    null
  )
}
function Lu(e, t) {
  var n = t.ref
  if (n === null) e !== null && e.ref !== null && (t.flags |= 2097664)
  else {
    if (typeof n != 'function' && typeof n != 'object') throw Error(T(284))
    ;(e === null || e.ref !== n) && (t.flags |= 2097664)
  }
}
function Nc(e, t, n, l, u) {
  return (
    nl(t),
    (n = qf(e, t, n, l, void 0, u)),
    (l = Bf()),
    e !== null && !Me
      ? ($f(e, t, u), Wt(e, t, u))
      : (F && l && Nf(t), (t.flags |= 1), Ce(e, t, n, u), t.child)
  )
}
function Ss(e, t, n, l, u, a) {
  return (
    nl(t),
    (t.updateQueue = null),
    (n = Lm(t, l, n, u)),
    Hm(e),
    (l = Bf()),
    e !== null && !Me
      ? ($f(e, t, a), Wt(e, t, a))
      : (F && l && Nf(t), (t.flags |= 1), Ce(e, t, n, a), t.child)
  )
}
function xs(e, t, n, l, u) {
  if ((nl(t), t.stateNode === null)) {
    var a = Rl,
      i = n.contextType
    typeof i == 'object' && i !== null && (a = qe(i)),
      (a = new n(l, a)),
      (t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null),
      (a.updater = _c),
      (t.stateNode = a),
      (a._reactInternals = t),
      (a = t.stateNode),
      (a.props = l),
      (a.state = t.memoizedState),
      (a.refs = {}),
      Jf(t),
      (i = n.contextType),
      (a.context = typeof i == 'object' && i !== null ? qe(i) : Rl),
      (a.state = t.memoizedState),
      (i = n.getDerivedStateFromProps),
      typeof i == 'function' && (Cr(t, n, i, l), (a.state = t.memoizedState)),
      typeof n.getDerivedStateFromProps == 'function' ||
        typeof a.getSnapshotBeforeUpdate == 'function' ||
        (typeof a.UNSAFE_componentWillMount != 'function' &&
          typeof a.componentWillMount != 'function') ||
        ((i = a.state),
        typeof a.componentWillMount == 'function' && a.componentWillMount(),
        typeof a.UNSAFE_componentWillMount == 'function' && a.UNSAFE_componentWillMount(),
        i !== a.state && _c.enqueueReplaceState(a, a.state, null),
        qu(t, l, a, u),
        ju(),
        (a.state = t.memoizedState)),
      typeof a.componentDidMount == 'function' && (t.flags |= 4194308),
      (l = !0)
  } else if (e === null) {
    a = t.stateNode
    var r = t.memoizedProps,
      c = tl(n, r)
    a.props = c
    var f = a.context,
      o = n.contextType
    ;(i = Rl), typeof o == 'object' && o !== null && (i = qe(o))
    var g = n.getDerivedStateFromProps
    ;(o = typeof g == 'function' || typeof a.getSnapshotBeforeUpdate == 'function'),
      (r = t.pendingProps !== r),
      o ||
        (typeof a.UNSAFE_componentWillReceiveProps != 'function' &&
          typeof a.componentWillReceiveProps != 'function') ||
        ((r || f !== i) && vs(t, a, l, i)),
      (rn = !1)
    var m = t.memoizedState
    ;(a.state = m),
      qu(t, l, a, u),
      ju(),
      (f = t.memoizedState),
      r || m !== f || rn
        ? (typeof g == 'function' && (Cr(t, n, g, l), (f = t.memoizedState)),
          (c = rn || gs(t, n, c, l, m, f, i))
            ? (o ||
                (typeof a.UNSAFE_componentWillMount != 'function' &&
                  typeof a.componentWillMount != 'function') ||
                (typeof a.componentWillMount == 'function' && a.componentWillMount(),
                typeof a.UNSAFE_componentWillMount == 'function' && a.UNSAFE_componentWillMount()),
              typeof a.componentDidMount == 'function' && (t.flags |= 4194308))
            : (typeof a.componentDidMount == 'function' && (t.flags |= 4194308),
              (t.memoizedProps = l),
              (t.memoizedState = f)),
          (a.props = l),
          (a.state = f),
          (a.context = i),
          (l = c))
        : (typeof a.componentDidMount == 'function' && (t.flags |= 4194308), (l = !1))
  } else {
    ;(a = t.stateNode),
      qc(e, t),
      (i = t.memoizedProps),
      (o = tl(n, i)),
      (a.props = o),
      (g = t.pendingProps),
      (m = a.context),
      (f = n.contextType),
      (c = Rl),
      typeof f == 'object' && f !== null && (c = qe(f)),
      (r = n.getDerivedStateFromProps),
      (f = typeof r == 'function' || typeof a.getSnapshotBeforeUpdate == 'function') ||
        (typeof a.UNSAFE_componentWillReceiveProps != 'function' &&
          typeof a.componentWillReceiveProps != 'function') ||
        ((i !== g || m !== c) && vs(t, a, l, c)),
      (rn = !1),
      (m = t.memoizedState),
      (a.state = m),
      qu(t, l, a, u),
      ju()
    var s = t.memoizedState
    i !== g || m !== s || rn || (e !== null && e.dependencies !== null && Ei(e.dependencies))
      ? (typeof r == 'function' && (Cr(t, n, r, l), (s = t.memoizedState)),
        (o =
          rn ||
          gs(t, n, o, l, m, s, c) ||
          (e !== null && e.dependencies !== null && Ei(e.dependencies)))
          ? (f ||
              (typeof a.UNSAFE_componentWillUpdate != 'function' &&
                typeof a.componentWillUpdate != 'function') ||
              (typeof a.componentWillUpdate == 'function' && a.componentWillUpdate(l, s, c),
              typeof a.UNSAFE_componentWillUpdate == 'function' &&
                a.UNSAFE_componentWillUpdate(l, s, c)),
            typeof a.componentDidUpdate == 'function' && (t.flags |= 4),
            typeof a.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
          : (typeof a.componentDidUpdate != 'function' ||
              (i === e.memoizedProps && m === e.memoizedState) ||
              (t.flags |= 4),
            typeof a.getSnapshotBeforeUpdate != 'function' ||
              (i === e.memoizedProps && m === e.memoizedState) ||
              (t.flags |= 1024),
            (t.memoizedProps = l),
            (t.memoizedState = s)),
        (a.props = l),
        (a.state = s),
        (a.context = c),
        (l = o))
      : (typeof a.componentDidUpdate != 'function' ||
          (i === e.memoizedProps && m === e.memoizedState) ||
          (t.flags |= 4),
        typeof a.getSnapshotBeforeUpdate != 'function' ||
          (i === e.memoizedProps && m === e.memoizedState) ||
          (t.flags |= 1024),
        (l = !1))
  }
  return (
    (a = l),
    Lu(e, t),
    (l = (t.flags & 128) !== 0),
    a || l
      ? ((a = t.stateNode),
        (n = l && typeof n.getDerivedStateFromError != 'function' ? null : a.render()),
        (t.flags |= 1),
        e !== null && l
          ? ((t.child = In(t, e.child, null, u)), (t.child = In(t, null, n, u)))
          : Ce(e, t, n, u),
        (t.memoizedState = a.state),
        (e = t.child))
      : (e = Wt(e, t, u)),
    e
  )
}
function Ts(e, t, n, l) {
  return ma(), (t.flags |= 256), Ce(e, t, n, l), t.child
}
var Nr = { dehydrated: null, treeContext: null, retryLane: 0 }
function zr(e) {
  return { baseLanes: e, cachePool: zm() }
}
function Hr(e, t, n) {
  return (e = e !== null ? e.childLanes & ~n : 0), t && (e |= ht), e
}
function Eh(e, t, n) {
  var l = t.pendingProps,
    u = !1,
    a = (t.flags & 128) !== 0,
    i
  if (
    ((i = a) || (i = e !== null && e.memoizedState === null ? !1 : (Te.current & 2) !== 0),
    i && ((u = !0), (t.flags &= -129)),
    (i = (t.flags & 32) !== 0),
    (t.flags &= -33),
    e === null)
  ) {
    if (F) {
      if ((u ? fn(t) : on(), F)) {
        var r = Ne,
          c
        if ((c = r)) {
          e: {
            for (c = r, r = Ot; c.nodeType !== 8; ) {
              if (!r) {
                r = null
                break e
              }
              if (((c = Et(c.nextSibling)), c === null)) {
                r = null
                break e
              }
            }
            r = c
          }
          r !== null
            ? ((t.memoizedState = {
                dehydrated: r,
                treeContext: Zn !== null ? { id: Xt, overflow: Qt } : null,
                retryLane: 536870912
              }),
              (c = mt(18, null, null, 0)),
              (c.stateNode = r),
              (c.return = t),
              (t.child = c),
              (Be = t),
              (Ne = null),
              (c = !0))
            : (c = !1)
        }
        c || Pn(t)
      }
      if (((r = t.memoizedState), r !== null && ((r = r.dehydrated), r !== null)))
        return r.data === '$!' ? (t.lanes = 16) : (t.lanes = 536870912), null
      Vt(t)
    }
    return (
      (r = l.children),
      (l = l.fallback),
      u
        ? (on(),
          (u = t.mode),
          (r = Hc({ mode: 'hidden', children: r }, u)),
          (l = Fn(l, u, n, null)),
          (r.return = t),
          (l.return = t),
          (r.sibling = l),
          (t.child = r),
          (u = t.child),
          (u.memoizedState = zr(n)),
          (u.childLanes = Hr(e, i, n)),
          (t.memoizedState = Nr),
          l)
        : (fn(t), zc(t, r))
    )
  }
  if (((c = e.memoizedState), c !== null && ((r = c.dehydrated), r !== null))) {
    if (a)
      t.flags & 256
        ? (fn(t), (t.flags &= -257), (t = Lr(e, t, n)))
        : t.memoizedState !== null
        ? (on(), (t.child = e.child), (t.flags |= 128), (t = null))
        : (on(),
          (u = l.fallback),
          (r = t.mode),
          (l = Hc({ mode: 'visible', children: l.children }, r)),
          (u = Fn(u, r, n, null)),
          (u.flags |= 2),
          (l.return = t),
          (u.return = t),
          (l.sibling = u),
          (t.child = l),
          In(t, e.child, null, n),
          (l = t.child),
          (l.memoizedState = zr(n)),
          (l.childLanes = Hr(e, i, n)),
          (t.memoizedState = Nr),
          (t = u))
    else if ((fn(t), r.data === '$!')) {
      if (((i = r.nextSibling && r.nextSibling.dataset), i)) var f = i.dgst
      ;(i = f),
        (l = Error(T(419))),
        (l.stack = ''),
        (l.digest = i),
        Ju({ value: l, source: null, stack: null }),
        (t = Lr(e, t, n))
    } else if ((Me || va(e, t, n, !1), (i = (n & e.childLanes) !== 0), Me || i)) {
      if (((i = te), i !== null)) {
        if (((l = n & -n), l & 42)) l = 1
        else
          switch (l) {
            case 2:
              l = 1
              break
            case 8:
              l = 4
              break
            case 32:
              l = 16
              break
            case 128:
            case 256:
            case 512:
            case 1024:
            case 2048:
            case 4096:
            case 8192:
            case 16384:
            case 32768:
            case 65536:
            case 131072:
            case 262144:
            case 524288:
            case 1048576:
            case 2097152:
            case 4194304:
            case 8388608:
            case 16777216:
            case 33554432:
              l = 64
              break
            case 268435456:
              l = 134217728
              break
            default:
              l = 0
          }
        if (((l = l & (i.suspendedLanes | n) ? 0 : l), l !== 0 && l !== c.retryLane))
          throw ((c.retryLane = l), wn(e, l), Xe(i, e, l), ph)
      }
      r.data === '$?' || Zc(), (t = Lr(e, t, n))
    } else
      r.data === '$?'
        ? ((t.flags |= 128),
          (t.child = e.child),
          (t = iy.bind(null, e)),
          (r._reactRetry = t),
          (t = null))
        : ((e = c.treeContext),
          (Ne = Et(r.nextSibling)),
          (Be = t),
          (F = !0),
          (yt = null),
          (Ot = !1),
          e !== null &&
            ((ct[ft++] = Xt),
            (ct[ft++] = Qt),
            (ct[ft++] = Zn),
            (Xt = e.id),
            (Qt = e.overflow),
            (Zn = t)),
          (t = zc(t, l.children)),
          (t.flags |= 4096))
    return t
  }
  return u
    ? (on(),
      (u = l.fallback),
      (r = t.mode),
      (c = e.child),
      (f = c.sibling),
      (l = En(c, { mode: 'hidden', children: l.children })),
      (l.subtreeFlags = c.subtreeFlags & 31457280),
      f !== null ? (u = En(f, u)) : ((u = Fn(u, r, n, null)), (u.flags |= 2)),
      (u.return = t),
      (l.return = t),
      (l.sibling = u),
      (t.child = l),
      (l = u),
      (u = t.child),
      (r = e.child.memoizedState),
      r === null
        ? (r = zr(n))
        : ((c = r.cachePool),
          c !== null
            ? ((f = xe._currentValue), (c = c.parent !== f ? { parent: f, pool: f } : c))
            : (c = zm()),
          (r = { baseLanes: r.baseLanes | n, cachePool: c })),
      (u.memoizedState = r),
      (u.childLanes = Hr(e, i, n)),
      (t.memoizedState = Nr),
      l)
    : (fn(t),
      (n = e.child),
      (e = n.sibling),
      (n = En(n, { mode: 'visible', children: l.children })),
      (n.return = t),
      (n.sibling = null),
      e !== null &&
        ((i = t.deletions), i === null ? ((t.deletions = [e]), (t.flags |= 16)) : i.push(e)),
      (t.child = n),
      (t.memoizedState = null),
      n)
}
function zc(e, t) {
  return (t = Hc({ mode: 'visible', children: t }, e.mode)), (t.return = e), (e.child = t)
}
function Hc(e, t) {
  return Gh(e, t, 0, null)
}
function Lr(e, t, n) {
  return (
    In(t, e.child, null, n),
    (e = zc(t, t.pendingProps.children)),
    (e.flags |= 2),
    (t.memoizedState = null),
    e
  )
}
function Os(e, t, n) {
  e.lanes |= t
  var l = e.alternate
  l !== null && (l.lanes |= t), Uc(e.return, t, n)
}
function Ur(e, t, n, l, u) {
  var a = e.memoizedState
  a === null
    ? (e.memoizedState = {
        isBackwards: t,
        rendering: null,
        renderingStartTime: 0,
        last: l,
        tail: n,
        tailMode: u
      })
    : ((a.isBackwards = t),
      (a.rendering = null),
      (a.renderingStartTime = 0),
      (a.last = l),
      (a.tail = n),
      (a.tailMode = u))
}
function Sh(e, t, n) {
  var l = t.pendingProps,
    u = l.revealOrder,
    a = l.tail
  if ((Ce(e, t, l.children, n), (l = Te.current), l & 2)) (l = (l & 1) | 2), (t.flags |= 128)
  else {
    if (e !== null && e.flags & 128)
      e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && Os(e, n, t)
        else if (e.tag === 19) Os(e, n, t)
        else if (e.child !== null) {
          ;(e.child.return = e), (e = e.child)
          continue
        }
        if (e === t) break e
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) break e
          e = e.return
        }
        ;(e.sibling.return = e.return), (e = e.sibling)
      }
    l &= 1
  }
  switch ((re(Te, l), u)) {
    case 'forwards':
      for (n = t.child, u = null; n !== null; )
        (e = n.alternate), e !== null && gi(e) === null && (u = n), (n = n.sibling)
      ;(n = u),
        n === null ? ((u = t.child), (t.child = null)) : ((u = n.sibling), (n.sibling = null)),
        Ur(t, !1, u, n, a)
      break
    case 'backwards':
      for (n = null, u = t.child, t.child = null; u !== null; ) {
        if (((e = u.alternate), e !== null && gi(e) === null)) {
          t.child = u
          break
        }
        ;(e = u.sibling), (u.sibling = n), (n = u), (u = e)
      }
      Ur(t, !0, n, null, a)
      break
    case 'together':
      Ur(t, !1, null, null, void 0)
      break
    default:
      t.memoizedState = null
  }
  return t.child
}
function Wt(e, t, n) {
  if ((e !== null && (t.dependencies = e.dependencies), (Mn |= t.lanes), !(n & t.childLanes)))
    if (e !== null) {
      if ((va(e, t, n, !1), (n & t.childLanes) === 0)) return null
    } else return null
  if (e !== null && t.child !== e.child) throw Error(T(153))
  if (t.child !== null) {
    for (e = t.child, n = En(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; )
      (e = e.sibling), (n = n.sibling = En(e, e.pendingProps)), (n.return = t)
    n.sibling = null
  }
  return t.child
}
function Kf(e, t) {
  return e.lanes & t ? !0 : ((e = e.dependencies), !!(e !== null && Ei(e)))
}
function Z0(e, t, n) {
  switch (t.tag) {
    case 3:
      ii(t, t.stateNode.containerInfo), sn(t, xe, e.memoizedState.cache), ma()
      break
    case 27:
    case 5:
      hc(t)
      break
    case 4:
      ii(t, t.stateNode.containerInfo)
      break
    case 10:
      sn(t, t.type, t.memoizedProps.value)
      break
    case 13:
      var l = t.memoizedState
      if (l !== null)
        return l.dehydrated !== null
          ? (fn(t), (t.flags |= 128), null)
          : n & t.child.childLanes
          ? Eh(e, t, n)
          : (fn(t), (e = Wt(e, t, n)), e !== null ? e.sibling : null)
      fn(t)
      break
    case 19:
      var u = (e.flags & 128) !== 0
      if (
        ((l = (n & t.childLanes) !== 0), l || (va(e, t, n, !1), (l = (n & t.childLanes) !== 0)), u)
      ) {
        if (l) return Sh(e, t, n)
        t.flags |= 128
      }
      if (
        ((u = t.memoizedState),
        u !== null && ((u.rendering = null), (u.tail = null), (u.lastEffect = null)),
        re(Te, Te.current),
        l)
      )
        break
      return null
    case 22:
    case 23:
      return (t.lanes = 0), bh(e, t, n)
    case 24:
      sn(t, xe, e.memoizedState.cache)
  }
  return Wt(e, t, n)
}
function xh(e, t, n) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps) Me = !0
    else {
      if (!Kf(e, n) && !(t.flags & 128)) return (Me = !1), Z0(e, t, n)
      Me = !!(e.flags & 131072)
    }
  else (Me = !1), F && t.flags & 1048576 && Rm(t, mi, t.index)
  switch (((t.lanes = 0), t.tag)) {
    case 16:
      e: {
        e = t.pendingProps
        var l = t.elementType,
          u = l._init
        if (((l = u(l._payload)), (t.type = l), typeof l == 'function'))
          If(l)
            ? ((e = tl(l, e)), (t.tag = 1), (t = xs(null, t, l, e, n)))
            : ((t.tag = 0), (t = Nc(null, t, l, e, n)))
        else {
          if (l != null) {
            if (((u = l.$$typeof), u === Ef)) {
              ;(t.tag = 11), (t = ys(null, t, l, e, n))
              break e
            } else if (u === Sf) {
              ;(t.tag = 14), (t = bs(null, t, l, e, n))
              break e
            }
          }
          throw ((t = dc(l) || l), Error(T(306, t, '')))
        }
      }
      return t
    case 0:
      return Nc(e, t, t.type, t.pendingProps, n)
    case 1:
      return (l = t.type), (u = tl(l, t.pendingProps)), xs(e, t, l, u, n)
    case 3:
      e: {
        if ((ii(t, t.stateNode.containerInfo), e === null)) throw Error(T(387))
        var a = t.pendingProps
        ;(u = t.memoizedState), (l = u.element), qc(e, t), qu(t, a, null, n)
        var i = t.memoizedState
        if (
          ((a = i.cache),
          sn(t, xe, a),
          a !== u.cache && jc(t, [xe], n, !0),
          ju(),
          (a = i.element),
          u.isDehydrated)
        )
          if (
            ((u = { element: a, isDehydrated: !1, cache: i.cache }),
            (t.updateQueue.baseState = u),
            (t.memoizedState = u),
            t.flags & 256)
          ) {
            t = Ts(e, t, a, n)
            break e
          } else if (a !== l) {
            ;(l = dt(Error(T(424)), t)), Ju(l), (t = Ts(e, t, a, n))
            break e
          } else
            for (
              Ne = Et(t.stateNode.containerInfo.firstChild),
                Be = t,
                F = !0,
                yt = null,
                Ot = !0,
                n = Cm(t, null, a, n),
                t.child = n;
              n;

            )
              (n.flags = (n.flags & -3) | 4096), (n = n.sibling)
        else {
          if ((ma(), a === l)) {
            t = Wt(e, t, n)
            break e
          }
          Ce(e, t, a, n)
        }
        t = t.child
      }
      return t
    case 26:
      return (
        Lu(e, t),
        e === null
          ? (n = Gs(t.type, null, t.pendingProps, null))
            ? (t.memoizedState = n)
            : F ||
              ((n = t.type),
              (e = t.pendingProps),
              (l = Ri(pn.current).createElement(n)),
              (l[je] = t),
              (l[Fe] = e),
              ze(l, n, e),
              Re(l),
              (t.stateNode = l))
          : (t.memoizedState = Gs(t.type, e.memoizedProps, t.pendingProps, e.memoizedState)),
        null
      )
    case 27:
      return (
        hc(t),
        e === null &&
          F &&
          ((l = t.stateNode = ig(t.type, t.pendingProps, pn.current)),
          (Be = t),
          (Ot = !0),
          (Ne = Et(l.firstChild))),
        (l = t.pendingProps.children),
        e !== null || F ? Ce(e, t, l, n) : (t.child = In(t, null, l, n)),
        Lu(e, t),
        t.child
      )
    case 5:
      return (
        e === null &&
          F &&
          ((u = l = Ne) &&
            ((l = xy(l, t.type, t.pendingProps, Ot)),
            l !== null
              ? ((t.stateNode = l), (Be = t), (Ne = Et(l.firstChild)), (Ot = !1), (u = !0))
              : (u = !1)),
          u || Pn(t)),
        hc(t),
        (u = t.type),
        (a = t.pendingProps),
        (i = e !== null ? e.memoizedProps : null),
        (l = a.children),
        Wc(u, a) ? (l = null) : i !== null && Wc(u, i) && (t.flags |= 32),
        t.memoizedState !== null && ((u = qf(e, t, B0, null, null, n)), (na._currentValue = u)),
        Lu(e, t),
        Ce(e, t, l, n),
        t.child
      )
    case 6:
      return (
        e === null &&
          F &&
          ((e = n = Ne) &&
            ((n = Ty(n, t.pendingProps, Ot)),
            n !== null ? ((t.stateNode = n), (Be = t), (Ne = null), (e = !0)) : (e = !1)),
          e || Pn(t)),
        null
      )
    case 13:
      return Eh(e, t, n)
    case 4:
      return (
        ii(t, t.stateNode.containerInfo),
        (l = t.pendingProps),
        e === null ? (t.child = In(t, null, l, n)) : Ce(e, t, l, n),
        t.child
      )
    case 11:
      return ys(e, t, t.type, t.pendingProps, n)
    case 7:
      return Ce(e, t, t.pendingProps, n), t.child
    case 8:
      return Ce(e, t, t.pendingProps.children, n), t.child
    case 12:
      return Ce(e, t, t.pendingProps.children, n), t.child
    case 10:
      return (l = t.pendingProps), sn(t, t.type, l.value), Ce(e, t, l.children, n), t.child
    case 9:
      return (
        (u = t.type._context),
        (l = t.pendingProps.children),
        nl(t),
        (u = qe(u)),
        (l = l(u)),
        (t.flags |= 1),
        Ce(e, t, l, n),
        t.child
      )
    case 14:
      return bs(e, t, t.type, t.pendingProps, n)
    case 15:
      return yh(e, t, t.type, t.pendingProps, n)
    case 19:
      return Sh(e, t, n)
    case 22:
      return bh(e, t, n)
    case 24:
      return (
        nl(t),
        (l = qe(xe)),
        e === null
          ? ((u = Uf()),
            u === null &&
              ((u = te),
              (a = Lf()),
              (u.pooledCache = a),
              a.refCount++,
              a !== null && (u.pooledCacheLanes |= n),
              (u = a)),
            (t.memoizedState = { parent: l, cache: u }),
            Jf(t),
            sn(t, xe, u))
          : (e.lanes & n && (qc(e, t), qu(t, null, null, n), ju()),
            (u = e.memoizedState),
            (a = t.memoizedState),
            u.parent !== l
              ? ((u = { parent: l, cache: l }),
                (t.memoizedState = u),
                t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = u),
                sn(t, xe, l))
              : ((l = a.cache), sn(t, xe, l), l !== u.cache && jc(t, [xe], n, !0))),
        Ce(e, t, t.pendingProps.children, n),
        t.child
      )
    case 29:
      throw t.pendingProps
  }
  throw Error(T(156, t.tag))
}
var Lc = Nt(null),
  dl = null,
  Zt = null
function sn(e, t, n) {
  re(Lc, t._currentValue), (t._currentValue = n)
}
function kt(e) {
  ;(e._currentValue = Lc.current), De(Lc)
}
function Uc(e, t, n) {
  for (; e !== null; ) {
    var l = e.alternate
    if (
      ((e.childLanes & t) !== t
        ? ((e.childLanes |= t), l !== null && (l.childLanes |= t))
        : l !== null && (l.childLanes & t) !== t && (l.childLanes |= t),
      e === n)
    )
      break
    e = e.return
  }
}
function jc(e, t, n, l) {
  var u = e.child
  for (u !== null && (u.return = e); u !== null; ) {
    var a = u.dependencies
    if (a !== null) {
      var i = u.child
      a = a.firstContext
      e: for (; a !== null; ) {
        var r = a
        a = u
        for (var c = 0; c < t.length; c++)
          if (r.context === t[c]) {
            ;(a.lanes |= n),
              (r = a.alternate),
              r !== null && (r.lanes |= n),
              Uc(a.return, n, e),
              l || (i = null)
            break e
          }
        a = r.next
      }
    } else if (u.tag === 18) {
      if (((i = u.return), i === null)) throw Error(T(341))
      ;(i.lanes |= n), (a = i.alternate), a !== null && (a.lanes |= n), Uc(i, n, e), (i = null)
    } else i = u.child
    if (i !== null) i.return = u
    else
      for (i = u; i !== null; ) {
        if (i === e) {
          i = null
          break
        }
        if (((u = i.sibling), u !== null)) {
          ;(u.return = i.return), (i = u)
          break
        }
        i = i.return
      }
    u = i
  }
}
function va(e, t, n, l) {
  e = null
  for (var u = t, a = !1; u !== null; ) {
    if (!a) {
      if (u.flags & 524288) a = !0
      else if (u.flags & 262144) break
    }
    if (u.tag === 10) {
      var i = u.alternate
      if (i === null) throw Error(T(387))
      if (((i = i.memoizedProps), i !== null)) {
        var r = u.type
        lt(u.pendingProps.value, i.value) || (e !== null ? e.push(r) : (e = [r]))
      }
    } else if (u === ai.current) {
      if (((i = u.alternate), i === null)) throw Error(T(387))
      i.memoizedState.memoizedState !== u.memoizedState.memoizedState &&
        (e !== null ? e.push(na) : (e = [na]))
    }
    u = u.return
  }
  e !== null && jc(t, e, n, l), (t.flags |= 262144)
}
function Ei(e) {
  for (e = e.firstContext; e !== null; ) {
    if (!lt(e.context._currentValue, e.memoizedValue)) return !0
    e = e.next
  }
  return !1
}
function nl(e) {
  ;(dl = e), (Zt = null), (e = e.dependencies), e !== null && (e.firstContext = null)
}
function qe(e) {
  return Th(dl, e)
}
function ja(e, t) {
  return dl === null && nl(e), Th(e, t)
}
function Th(e, t) {
  var n = t._currentValue
  if (((t = { context: t, memoizedValue: n, next: null }), Zt === null)) {
    if (e === null) throw Error(T(308))
    ;(Zt = t), (e.dependencies = { lanes: 0, firstContext: t }), (e.flags |= 524288)
  } else Zt = Zt.next = t
  return n
}
var rn = !1
function Jf(e) {
  e.updateQueue = {
    baseState: e.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, lanes: 0, hiddenCallbacks: null },
    callbacks: null
  }
}
function qc(e, t) {
  ;(e = e.updateQueue),
    t.updateQueue === e &&
      (t.updateQueue = {
        baseState: e.baseState,
        firstBaseUpdate: e.firstBaseUpdate,
        lastBaseUpdate: e.lastBaseUpdate,
        shared: e.shared,
        callbacks: null
      })
}
function yn(e) {
  return { lane: e, tag: 0, payload: null, callback: null, next: null }
}
function bn(e, t, n) {
  var l = e.updateQueue
  if (l === null) return null
  if (((l = l.shared), oe & 2)) {
    var u = l.pending
    return (
      u === null ? (t.next = t) : ((t.next = u.next), (u.next = t)),
      (l.pending = t),
      (t = si(e)),
      Am(e, null, n),
      t
    )
  }
  return ki(e, l, t, n), si(e)
}
function Uu(e, t, n) {
  if (((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194176) !== 0))) {
    var l = t.lanes
    ;(l &= e.pendingLanes), (n |= l), (t.lanes = n), Id(e, n)
  }
}
function jr(e, t) {
  var n = e.updateQueue,
    l = e.alternate
  if (l !== null && ((l = l.updateQueue), n === l)) {
    var u = null,
      a = null
    if (((n = n.firstBaseUpdate), n !== null)) {
      do {
        var i = { lane: n.lane, tag: n.tag, payload: n.payload, callback: null, next: null }
        a === null ? (u = a = i) : (a = a.next = i), (n = n.next)
      } while (n !== null)
      a === null ? (u = a = t) : (a = a.next = t)
    } else u = a = t
    ;(n = {
      baseState: l.baseState,
      firstBaseUpdate: u,
      lastBaseUpdate: a,
      shared: l.shared,
      callbacks: l.callbacks
    }),
      (e.updateQueue = n)
    return
  }
  ;(e = n.lastBaseUpdate),
    e === null ? (n.firstBaseUpdate = t) : (e.next = t),
    (n.lastBaseUpdate = t)
}
var Bc = !1
function ju() {
  if (Bc) {
    var e = Ll
    if (e !== null) throw e
  }
}
function qu(e, t, n, l) {
  Bc = !1
  var u = e.updateQueue
  rn = !1
  var a = u.firstBaseUpdate,
    i = u.lastBaseUpdate,
    r = u.shared.pending
  if (r !== null) {
    u.shared.pending = null
    var c = r,
      f = c.next
    ;(c.next = null), i === null ? (a = f) : (i.next = f), (i = c)
    var o = e.alternate
    o !== null &&
      ((o = o.updateQueue),
      (r = o.lastBaseUpdate),
      r !== i && (r === null ? (o.firstBaseUpdate = f) : (r.next = f), (o.lastBaseUpdate = c)))
  }
  if (a !== null) {
    var g = u.baseState
    ;(i = 0), (o = f = c = null), (r = a)
    do {
      var m = r.lane & -536870913,
        s = m !== r.lane
      if (s ? (Z & m) === m : (l & m) === m) {
        m !== 0 && m === Vl && (Bc = !0),
          o !== null &&
            (o = o.next = { lane: 0, tag: r.tag, payload: r.payload, callback: null, next: null })
        e: {
          var y = e,
            E = r
          m = t
          var x = n
          switch (E.tag) {
            case 1:
              if (((y = E.payload), typeof y == 'function')) {
                g = y.call(x, g, m)
                break e
              }
              g = y
              break e
            case 3:
              y.flags = (y.flags & -65537) | 128
            case 0:
              if (((y = E.payload), (m = typeof y == 'function' ? y.call(x, g, m) : y), m == null))
                break e
              g = ue({}, g, m)
              break e
            case 2:
              rn = !0
          }
        }
        ;(m = r.callback),
          m !== null &&
            ((e.flags |= 64),
            s && (e.flags |= 8192),
            (s = u.callbacks),
            s === null ? (u.callbacks = [m]) : s.push(m))
      } else
        (s = { lane: m, tag: r.tag, payload: r.payload, callback: r.callback, next: null }),
          o === null ? ((f = o = s), (c = g)) : (o = o.next = s),
          (i |= m)
      if (((r = r.next), r === null)) {
        if (((r = u.shared.pending), r === null)) break
        ;(s = r), (r = s.next), (s.next = null), (u.lastBaseUpdate = s), (u.shared.pending = null)
      }
    } while (!0)
    o === null && (c = g),
      (u.baseState = c),
      (u.firstBaseUpdate = f),
      (u.lastBaseUpdate = o),
      a === null && (u.shared.lanes = 0),
      (Mn |= i),
      (e.lanes = i),
      (e.memoizedState = g)
  }
}
function Oh(e, t) {
  if (typeof e != 'function') throw Error(T(191, e))
  e.call(t)
}
function wh(e, t) {
  var n = e.callbacks
  if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Oh(n[e], t)
}
function pa(e, t) {
  try {
    var n = t.updateQueue,
      l = n !== null ? n.lastEffect : null
    if (l !== null) {
      var u = l.next
      n = u
      do {
        if ((n.tag & e) === e) {
          l = void 0
          var a = n.create,
            i = n.inst
          ;(l = a()), (i.destroy = l)
        }
        n = n.next
      } while (n !== u)
    }
  } catch (r) {
    P(t, t.return, r)
  }
}
function Rn(e, t, n) {
  try {
    var l = t.updateQueue,
      u = l !== null ? l.lastEffect : null
    if (u !== null) {
      var a = u.next
      l = a
      do {
        if ((l.tag & e) === e) {
          var i = l.inst,
            r = i.destroy
          if (r !== void 0) {
            ;(i.destroy = void 0), (u = t)
            var c = n
            try {
              r()
            } catch (f) {
              P(u, c, f)
            }
          }
        }
        l = l.next
      } while (l !== a)
    }
  } catch (f) {
    P(t, t.return, f)
  }
}
function Ah(e) {
  var t = e.updateQueue
  if (t !== null) {
    var n = e.stateNode
    try {
      wh(t, n)
    } catch (l) {
      P(e, e.return, l)
    }
  }
}
function Rh(e, t, n) {
  ;(n.props = tl(e.type, e.memoizedProps)), (n.state = e.memoizedState)
  try {
    n.componentWillUnmount()
  } catch (l) {
    P(e, t, l)
  }
}
function Gn(e, t) {
  try {
    var n = e.ref
    if (n !== null) {
      var l = e.stateNode
      switch (e.tag) {
        case 26:
        case 27:
        case 5:
          var u = l
          break
        default:
          u = l
      }
      typeof n == 'function' ? (e.refCleanup = n(u)) : (n.current = u)
    }
  } catch (a) {
    P(e, t, a)
  }
}
function Pe(e, t) {
  var n = e.ref,
    l = e.refCleanup
  if (n !== null)
    if (typeof l == 'function')
      try {
        l()
      } catch (u) {
        P(e, t, u)
      } finally {
        ;(e.refCleanup = null), (e = e.alternate), e != null && (e.refCleanup = null)
      }
    else if (typeof n == 'function')
      try {
        n(null)
      } catch (u) {
        P(e, t, u)
      }
    else n.current = null
}
function Mh(e) {
  var t = e.type,
    n = e.memoizedProps,
    l = e.stateNode
  try {
    e: switch (t) {
      case 'button':
      case 'input':
      case 'select':
      case 'textarea':
        n.autoFocus && l.focus()
        break e
      case 'img':
        n.src ? (l.src = n.src) : n.srcSet && (l.srcset = n.srcSet)
    }
  } catch (u) {
    P(e, e.return, u)
  }
}
function ws(e, t, n) {
  try {
    var l = e.stateNode
    py(l, e.type, n, t), (l[Fe] = t)
  } catch (u) {
    P(e, e.return, u)
  }
}
function Dh(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 || e.tag === 4
}
function qr(e) {
  e: for (;;) {
    for (; e.sibling === null; ) {
      if (e.return === null || Dh(e.return)) return null
      e = e.return
    }
    for (
      e.sibling.return = e.return, e = e.sibling;
      e.tag !== 5 && e.tag !== 6 && e.tag !== 27 && e.tag !== 18;

    ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e
      ;(e.child.return = e), (e = e.child)
    }
    if (!(e.flags & 2)) return e.stateNode
  }
}
function $c(e, t, n) {
  var l = e.tag
  if (l === 5 || l === 6)
    (e = e.stateNode),
      t
        ? n.nodeType === 8
          ? n.parentNode.insertBefore(e, t)
          : n.insertBefore(e, t)
        : (n.nodeType === 8
            ? ((t = n.parentNode), t.insertBefore(e, n))
            : ((t = n), t.appendChild(e)),
          (n = n._reactRootContainer),
          n != null || t.onclick !== null || (t.onclick = er))
  else if (l !== 4 && l !== 27 && ((e = e.child), e !== null))
    for ($c(e, t, n), e = e.sibling; e !== null; ) $c(e, t, n), (e = e.sibling)
}
function Si(e, t, n) {
  var l = e.tag
  if (l === 5 || l === 6) (e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e)
  else if (l !== 4 && l !== 27 && ((e = e.child), e !== null))
    for (Si(e, t, n), e = e.sibling; e !== null; ) Si(e, t, n), (e = e.sibling)
}
var Bt = !1,
  se = !1,
  Br = !1,
  As = typeof WeakSet == 'function' ? WeakSet : Set,
  Ae = null,
  Rs = !1
function k0(e, t) {
  if (((e = e.containerInfo), (Kc = Ci), (e = bm(e)), Df(e))) {
    if ('selectionStart' in e) var n = { start: e.selectionStart, end: e.selectionEnd }
    else
      e: {
        n = ((n = e.ownerDocument) && n.defaultView) || window
        var l = n.getSelection && n.getSelection()
        if (l && l.rangeCount !== 0) {
          n = l.anchorNode
          var u = l.anchorOffset,
            a = l.focusNode
          l = l.focusOffset
          try {
            n.nodeType, a.nodeType
          } catch {
            n = null
            break e
          }
          var i = 0,
            r = -1,
            c = -1,
            f = 0,
            o = 0,
            g = e,
            m = null
          t: for (;;) {
            for (
              var s;
              g !== n || (u !== 0 && g.nodeType !== 3) || (r = i + u),
                g !== a || (l !== 0 && g.nodeType !== 3) || (c = i + l),
                g.nodeType === 3 && (i += g.nodeValue.length),
                (s = g.firstChild) !== null;

            )
              (m = g), (g = s)
            for (;;) {
              if (g === e) break t
              if (
                (m === n && ++f === u && (r = i),
                m === a && ++o === l && (c = i),
                (s = g.nextSibling) !== null)
              )
                break
              ;(g = m), (m = g.parentNode)
            }
            g = s
          }
          n = r === -1 || c === -1 ? null : { start: r, end: c }
        } else n = null
      }
    n = n || { start: 0, end: 0 }
  } else n = null
  for (Jc = { focusedElem: e, selectionRange: n }, Ci = !1, Ae = t; Ae !== null; )
    if (((t = Ae), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null))
      (e.return = t), (Ae = e)
    else
      for (; Ae !== null; ) {
        switch (((t = Ae), (a = t.alternate), (e = t.flags), t.tag)) {
          case 0:
            break
          case 11:
          case 15:
            break
          case 1:
            if (e & 1024 && a !== null) {
              ;(e = void 0),
                (n = t),
                (u = a.memoizedProps),
                (a = a.memoizedState),
                (l = n.stateNode)
              try {
                var y = tl(n.type, u, n.elementType === n.type)
                ;(e = l.getSnapshotBeforeUpdate(y, a)), (l.__reactInternalSnapshotBeforeUpdate = e)
              } catch (E) {
                P(n, n.return, E)
              }
            }
            break
          case 3:
            if (e & 1024) {
              if (((e = t.stateNode.containerInfo), (n = e.nodeType), n === 9)) Pc(e)
              else if (n === 1)
                switch (e.nodeName) {
                  case 'HEAD':
                  case 'HTML':
                  case 'BODY':
                    Pc(e)
                    break
                  default:
                    e.textContent = ''
                }
            }
            break
          case 5:
          case 26:
          case 27:
          case 6:
          case 4:
          case 17:
            break
          default:
            if (e & 1024) throw Error(T(163))
        }
        if (((e = t.sibling), e !== null)) {
          ;(e.return = t.return), (Ae = e)
          break
        }
        Ae = t.return
      }
  return (y = Rs), (Rs = !1), y
}
function _h(e, t, n) {
  var l = n.flags
  switch (n.tag) {
    case 0:
    case 11:
    case 15:
      jt(e, n), l & 4 && pa(5, n)
      break
    case 1:
      if ((jt(e, n), l & 4))
        if (((e = n.stateNode), t === null))
          try {
            e.componentDidMount()
          } catch (r) {
            P(n, n.return, r)
          }
        else {
          var u = tl(n.type, t.memoizedProps)
          t = t.memoizedState
          try {
            e.componentDidUpdate(u, t, e.__reactInternalSnapshotBeforeUpdate)
          } catch (r) {
            P(n, n.return, r)
          }
        }
      l & 64 && Ah(n), l & 512 && Gn(n, n.return)
      break
    case 3:
      if ((jt(e, n), l & 64 && ((l = n.updateQueue), l !== null))) {
        if (((e = null), n.child !== null))
          switch (n.child.tag) {
            case 27:
            case 5:
              e = n.child.stateNode
              break
            case 1:
              e = n.child.stateNode
          }
        try {
          wh(l, e)
        } catch (r) {
          P(n, n.return, r)
        }
      }
      break
    case 26:
      jt(e, n), l & 512 && Gn(n, n.return)
      break
    case 27:
    case 5:
      jt(e, n), t === null && l & 4 && Mh(n), l & 512 && Gn(n, n.return)
      break
    case 12:
      jt(e, n)
      break
    case 13:
      jt(e, n), l & 4 && zh(e, n)
      break
    case 22:
      if (((u = n.memoizedState !== null || Bt), !u)) {
        t = (t !== null && t.memoizedState !== null) || se
        var a = Bt,
          i = se
        ;(Bt = u),
          (se = t) && !i ? un(e, n, (n.subtreeFlags & 8772) !== 0) : jt(e, n),
          (Bt = a),
          (se = i)
      }
      l & 512 && (n.memoizedProps.mode === 'manual' ? Gn(n, n.return) : Pe(n, n.return))
      break
    default:
      jt(e, n)
  }
}
function Ch(e) {
  var t = e.alternate
  t !== null && ((e.alternate = null), Ch(t)),
    (e.child = null),
    (e.deletions = null),
    (e.sibling = null),
    e.tag === 5 && ((t = e.stateNode), t !== null && Tf(t)),
    (e.stateNode = null),
    (e.return = null),
    (e.dependencies = null),
    (e.memoizedProps = null),
    (e.memoizedState = null),
    (e.pendingProps = null),
    (e.stateNode = null),
    (e.updateQueue = null)
}
var ve = null,
  Je = !1
function Ut(e, t, n) {
  for (n = n.child; n !== null; ) Nh(e, t, n), (n = n.sibling)
}
function Nh(e, t, n) {
  if (Ie && typeof Ie.onCommitFiberUnmount == 'function')
    try {
      Ie.onCommitFiberUnmount(fa, n)
    } catch {}
  switch (n.tag) {
    case 26:
      se || Pe(n, t),
        Ut(e, t, n),
        n.memoizedState
          ? n.memoizedState.count--
          : n.stateNode && ((n = n.stateNode), n.parentNode.removeChild(n))
      break
    case 27:
      se || Pe(n, t)
      var l = ve,
        u = Je
      for (ve = n.stateNode, Ut(e, t, n), n = n.stateNode, t = n.attributes; t.length; )
        n.removeAttributeNode(t[0])
      Tf(n), (ve = l), (Je = u)
      break
    case 5:
      se || Pe(n, t)
    case 6:
      u = ve
      var a = Je
      if (((ve = null), Ut(e, t, n), (ve = u), (Je = a), ve !== null))
        if (Je)
          try {
            ;(e = ve),
              (l = n.stateNode),
              e.nodeType === 8 ? e.parentNode.removeChild(l) : e.removeChild(l)
          } catch (i) {
            P(n, t, i)
          }
        else
          try {
            ve.removeChild(n.stateNode)
          } catch (i) {
            P(n, t, i)
          }
      break
    case 18:
      ve !== null &&
        (Je
          ? ((t = ve),
            (n = n.stateNode),
            t.nodeType === 8 ? Wr(t.parentNode, n) : t.nodeType === 1 && Wr(t, n),
            aa(t))
          : Wr(ve, n.stateNode))
      break
    case 4:
      ;(l = ve),
        (u = Je),
        (ve = n.stateNode.containerInfo),
        (Je = !0),
        Ut(e, t, n),
        (ve = l),
        (Je = u)
      break
    case 0:
    case 11:
    case 14:
    case 15:
      se || Rn(2, n, t), se || Rn(4, n, t), Ut(e, t, n)
      break
    case 1:
      se ||
        (Pe(n, t), (l = n.stateNode), typeof l.componentWillUnmount == 'function' && Rh(n, t, l)),
        Ut(e, t, n)
      break
    case 21:
      Ut(e, t, n)
      break
    case 22:
      se || Pe(n, t), (se = (l = se) || n.memoizedState !== null), Ut(e, t, n), (se = l)
      break
    default:
      Ut(e, t, n)
  }
}
function zh(e, t) {
  if (
    t.memoizedState === null &&
    ((e = t.alternate),
    e !== null && ((e = e.memoizedState), e !== null && ((e = e.dehydrated), e !== null)))
  )
    try {
      aa(e)
    } catch (n) {
      P(t, t.return, n)
    }
}
function F0(e) {
  switch (e.tag) {
    case 13:
    case 19:
      var t = e.stateNode
      return t === null && (t = e.stateNode = new As()), t
    case 22:
      return (e = e.stateNode), (t = e._retryCache), t === null && (t = e._retryCache = new As()), t
    default:
      throw Error(T(435, e.tag))
  }
}
function $r(e, t) {
  var n = F0(e)
  t.forEach(function (l) {
    var u = ry.bind(null, e, l)
    n.has(l) || (n.add(l), l.then(u, u))
  })
}
function ut(e, t) {
  var n = t.deletions
  if (n !== null)
    for (var l = 0; l < n.length; l++) {
      var u = n[l],
        a = e,
        i = t,
        r = i
      e: for (; r !== null; ) {
        switch (r.tag) {
          case 27:
          case 5:
            ;(ve = r.stateNode), (Je = !1)
            break e
          case 3:
            ;(ve = r.stateNode.containerInfo), (Je = !0)
            break e
          case 4:
            ;(ve = r.stateNode.containerInfo), (Je = !0)
            break e
        }
        r = r.return
      }
      if (ve === null) throw Error(T(160))
      Nh(a, i, u),
        (ve = null),
        (Je = !1),
        (a = u.alternate),
        a !== null && (a.return = null),
        (u.return = null)
    }
  if (t.subtreeFlags & 13878) for (t = t.child; t !== null; ) Hh(t, e), (t = t.sibling)
}
var pt = null
function Hh(e, t) {
  var n = e.alternate,
    l = e.flags
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      ut(t, e), at(e), l & 4 && (Rn(3, e, e.return), pa(3, e), Rn(5, e, e.return))
      break
    case 1:
      ut(t, e),
        at(e),
        l & 512 && (se || n === null || Pe(n, n.return)),
        l & 64 &&
          Bt &&
          ((e = e.updateQueue),
          e !== null &&
            ((l = e.callbacks),
            l !== null &&
              ((n = e.shared.hiddenCallbacks),
              (e.shared.hiddenCallbacks = n === null ? l : n.concat(l)))))
      break
    case 26:
      var u = pt
      if ((ut(t, e), at(e), l & 512 && (se || n === null || Pe(n, n.return)), l & 4)) {
        var a = n !== null ? n.memoizedState : null
        if (((l = e.memoizedState), n === null))
          if (l === null)
            if (e.stateNode === null) {
              e: {
                ;(l = e.type), (n = e.memoizedProps), (u = u.ownerDocument || u)
                t: switch (l) {
                  case 'title':
                    ;(a = u.getElementsByTagName('title')[0]),
                      (!a ||
                        a[Zu] ||
                        a[je] ||
                        a.namespaceURI === 'http://www.w3.org/2000/svg' ||
                        a.hasAttribute('itemprop')) &&
                        ((a = u.createElement(l)),
                        u.head.insertBefore(a, u.querySelector('head > title'))),
                      ze(a, l, n),
                      (a[je] = e),
                      Re(a),
                      (l = a)
                    break e
                  case 'link':
                    var i = Qs('link', 'href', u).get(l + (n.href || ''))
                    if (i) {
                      for (var r = 0; r < i.length; r++)
                        if (
                          ((a = i[r]),
                          a.getAttribute('href') === (n.href == null ? null : n.href) &&
                            a.getAttribute('rel') === (n.rel == null ? null : n.rel) &&
                            a.getAttribute('title') === (n.title == null ? null : n.title) &&
                            a.getAttribute('crossorigin') ===
                              (n.crossOrigin == null ? null : n.crossOrigin))
                        ) {
                          i.splice(r, 1)
                          break t
                        }
                    }
                    ;(a = u.createElement(l)), ze(a, l, n), u.head.appendChild(a)
                    break
                  case 'meta':
                    if ((i = Qs('meta', 'content', u).get(l + (n.content || '')))) {
                      for (r = 0; r < i.length; r++)
                        if (
                          ((a = i[r]),
                          a.getAttribute('content') ===
                            (n.content == null ? null : '' + n.content) &&
                            a.getAttribute('name') === (n.name == null ? null : n.name) &&
                            a.getAttribute('property') ===
                              (n.property == null ? null : n.property) &&
                            a.getAttribute('http-equiv') ===
                              (n.httpEquiv == null ? null : n.httpEquiv) &&
                            a.getAttribute('charset') === (n.charSet == null ? null : n.charSet))
                        ) {
                          i.splice(r, 1)
                          break t
                        }
                    }
                    ;(a = u.createElement(l)), ze(a, l, n), u.head.appendChild(a)
                    break
                  default:
                    throw Error(T(468, l))
                }
                ;(a[je] = e), Re(a), (l = a)
              }
              e.stateNode = l
            } else Vs(u, e.type, e.stateNode)
          else e.stateNode = Xs(u, l, e.memoizedProps)
        else
          a !== l
            ? (a === null
                ? n.stateNode !== null && ((n = n.stateNode), n.parentNode.removeChild(n))
                : a.count--,
              l === null ? Vs(u, e.type, e.stateNode) : Xs(u, l, e.memoizedProps))
            : l === null && e.stateNode !== null && ws(e, e.memoizedProps, n.memoizedProps)
      }
      break
    case 27:
      if (l & 4 && e.alternate === null) {
        ;(u = e.stateNode), (a = e.memoizedProps)
        try {
          for (var c = u.firstChild; c; ) {
            var f = c.nextSibling,
              o = c.nodeName
            c[Zu] ||
              o === 'HEAD' ||
              o === 'BODY' ||
              o === 'SCRIPT' ||
              o === 'STYLE' ||
              (o === 'LINK' && c.rel.toLowerCase() === 'stylesheet') ||
              u.removeChild(c),
              (c = f)
          }
          for (var g = e.type, m = u.attributes; m.length; ) u.removeAttributeNode(m[0])
          ze(u, g, a), (u[je] = e), (u[Fe] = a)
        } catch (y) {
          P(e, e.return, y)
        }
      }
    case 5:
      if ((ut(t, e), at(e), l & 512 && (se || n === null || Pe(n, n.return)), e.flags & 32)) {
        u = e.stateNode
        try {
          Xl(u, '')
        } catch (y) {
          P(e, e.return, y)
        }
      }
      l & 4 &&
        e.stateNode != null &&
        ((u = e.memoizedProps), ws(e, u, n !== null ? n.memoizedProps : u)),
        l & 1024 && (Br = !0)
      break
    case 6:
      if ((ut(t, e), at(e), l & 4)) {
        if (e.stateNode === null) throw Error(T(162))
        ;(l = e.memoizedProps), (n = e.stateNode)
        try {
          n.nodeValue = l
        } catch (y) {
          P(e, e.return, y)
        }
      }
      break
    case 3:
      if (
        ((ni = null),
        (u = pt),
        (pt = Mi(t.containerInfo)),
        ut(t, e),
        (pt = u),
        at(e),
        l & 4 && n !== null && n.memoizedState.isDehydrated)
      )
        try {
          aa(t.containerInfo)
        } catch (y) {
          P(e, e.return, y)
        }
      Br && ((Br = !1), Lh(e))
      break
    case 4:
      ;(l = pt), (pt = Mi(e.stateNode.containerInfo)), ut(t, e), at(e), (pt = l)
      break
    case 12:
      ut(t, e), at(e)
      break
    case 13:
      ut(t, e),
        at(e),
        e.child.flags & 8192 &&
          (e.memoizedState !== null) != (n !== null && n.memoizedState !== null) &&
          (no = Rt()),
        l & 4 && ((l = e.updateQueue), l !== null && ((e.updateQueue = null), $r(e, l)))
      break
    case 22:
      if (
        (l & 512 && (se || n === null || Pe(n, n.return)),
        (c = e.memoizedState !== null),
        (f = n !== null && n.memoizedState !== null),
        (o = Bt),
        (g = se),
        (Bt = o || c),
        (se = g || f),
        ut(t, e),
        (se = g),
        (Bt = o),
        at(e),
        (t = e.stateNode),
        (t._current = e),
        (t._visibility &= -3),
        (t._visibility |= t._pendingVisibility & 2),
        l & 8192 &&
          ((t._visibility = c ? t._visibility & -2 : t._visibility | 1),
          c && ((t = Bt || se), n === null || f || t || pl(e)),
          e.memoizedProps === null || e.memoizedProps.mode !== 'manual'))
      )
        e: for (n = null, t = e; ; ) {
          if (t.tag === 5 || t.tag === 26 || t.tag === 27) {
            if (n === null) {
              f = n = t
              try {
                if (((u = f.stateNode), c))
                  (a = u.style),
                    typeof a.setProperty == 'function'
                      ? a.setProperty('display', 'none', 'important')
                      : (a.display = 'none')
                else {
                  ;(i = f.stateNode), (r = f.memoizedProps.style)
                  var s = r != null && r.hasOwnProperty('display') ? r.display : null
                  i.style.display = s == null || typeof s == 'boolean' ? '' : ('' + s).trim()
                }
              } catch (y) {
                P(f, f.return, y)
              }
            }
          } else if (t.tag === 6) {
            if (n === null) {
              f = t
              try {
                f.stateNode.nodeValue = c ? '' : f.memoizedProps
              } catch (y) {
                P(f, f.return, y)
              }
            }
          } else if (
            ((t.tag !== 22 && t.tag !== 23) || t.memoizedState === null || t === e) &&
            t.child !== null
          ) {
            ;(t.child.return = t), (t = t.child)
            continue
          }
          if (t === e) break e
          for (; t.sibling === null; ) {
            if (t.return === null || t.return === e) break e
            n === t && (n = null), (t = t.return)
          }
          n === t && (n = null), (t.sibling.return = t.return), (t = t.sibling)
        }
      l & 4 &&
        ((l = e.updateQueue),
        l !== null && ((n = l.retryQueue), n !== null && ((l.retryQueue = null), $r(e, n))))
      break
    case 19:
      ut(t, e),
        at(e),
        l & 4 && ((l = e.updateQueue), l !== null && ((e.updateQueue = null), $r(e, l)))
      break
    case 21:
      break
    default:
      ut(t, e), at(e)
  }
}
function at(e) {
  var t = e.flags
  if (t & 2) {
    try {
      if (e.tag !== 27) {
        e: {
          for (var n = e.return; n !== null; ) {
            if (Dh(n)) {
              var l = n
              break e
            }
            n = n.return
          }
          throw Error(T(160))
        }
        switch (l.tag) {
          case 27:
            var u = l.stateNode,
              a = qr(e)
            Si(e, a, u)
            break
          case 5:
            var i = l.stateNode
            l.flags & 32 && (Xl(i, ''), (l.flags &= -33))
            var r = qr(e)
            Si(e, r, i)
            break
          case 3:
          case 4:
            var c = l.stateNode.containerInfo,
              f = qr(e)
            $c(e, f, c)
            break
          default:
            throw Error(T(161))
        }
      }
    } catch (o) {
      P(e, e.return, o)
    }
    e.flags &= -3
  }
  t & 4096 && (e.flags &= -4097)
}
function Lh(e) {
  if (e.subtreeFlags & 1024)
    for (e = e.child; e !== null; ) {
      var t = e
      Lh(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), (e = e.sibling)
    }
}
function jt(e, t) {
  if (t.subtreeFlags & 8772) for (t = t.child; t !== null; ) _h(e, t.alternate, t), (t = t.sibling)
}
function pl(e) {
  for (e = e.child; e !== null; ) {
    var t = e
    switch (t.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        Rn(4, t, t.return), pl(t)
        break
      case 1:
        Pe(t, t.return)
        var n = t.stateNode
        typeof n.componentWillUnmount == 'function' && Rh(t, t.return, n), pl(t)
        break
      case 26:
      case 27:
      case 5:
        Pe(t, t.return), pl(t)
        break
      case 22:
        Pe(t, t.return), t.memoizedState === null && pl(t)
        break
      default:
        pl(t)
    }
    e = e.sibling
  }
}
function un(e, t, n) {
  for (n = n && (t.subtreeFlags & 8772) !== 0, t = t.child; t !== null; ) {
    var l = t.alternate,
      u = e,
      a = t,
      i = a.flags
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
        un(u, a, n), pa(4, a)
        break
      case 1:
        if ((un(u, a, n), (l = a), (u = l.stateNode), typeof u.componentDidMount == 'function'))
          try {
            u.componentDidMount()
          } catch (f) {
            P(l, l.return, f)
          }
        if (((l = a), (u = l.updateQueue), u !== null)) {
          var r = l.stateNode
          try {
            var c = u.shared.hiddenCallbacks
            if (c !== null)
              for (u.shared.hiddenCallbacks = null, u = 0; u < c.length; u++) Oh(c[u], r)
          } catch (f) {
            P(l, l.return, f)
          }
        }
        n && i & 64 && Ah(a), Gn(a, a.return)
        break
      case 26:
      case 27:
      case 5:
        un(u, a, n), n && l === null && i & 4 && Mh(a), Gn(a, a.return)
        break
      case 12:
        un(u, a, n)
        break
      case 13:
        un(u, a, n), n && i & 4 && zh(u, a)
        break
      case 22:
        a.memoizedState === null && un(u, a, n), Gn(a, a.return)
        break
      default:
        un(u, a, n)
    }
    t = t.sibling
  }
}
function Wf(e, t) {
  var n = null
  e !== null &&
    e.memoizedState !== null &&
    e.memoizedState.cachePool !== null &&
    (n = e.memoizedState.cachePool.pool),
    (e = null),
    t.memoizedState !== null &&
      t.memoizedState.cachePool !== null &&
      (e = t.memoizedState.cachePool.pool),
    e !== n && (e != null && e.refCount++, n != null && ha(n))
}
function Pf(e, t) {
  ;(e = null),
    t.alternate !== null && (e = t.alternate.memoizedState.cache),
    (t = t.memoizedState.cache),
    t !== e && (t.refCount++, e != null && ha(e))
}
function ln(e, t, n, l) {
  if (t.subtreeFlags & 10256) for (t = t.child; t !== null; ) Uh(e, t, n, l), (t = t.sibling)
}
function Uh(e, t, n, l) {
  var u = t.flags
  switch (t.tag) {
    case 0:
    case 11:
    case 15:
      ln(e, t, n, l), u & 2048 && pa(9, t)
      break
    case 3:
      ln(e, t, n, l),
        u & 2048 &&
          ((e = null),
          t.alternate !== null && (e = t.alternate.memoizedState.cache),
          (t = t.memoizedState.cache),
          t !== e && (t.refCount++, e != null && ha(e)))
      break
    case 12:
      if (u & 2048) {
        ln(e, t, n, l), (e = t.stateNode)
        try {
          var a = t.memoizedProps,
            i = a.id,
            r = a.onPostCommit
          typeof r == 'function' &&
            r(i, t.alternate === null ? 'mount' : 'update', e.passiveEffectDuration, -0)
        } catch (c) {
          P(t, t.return, c)
        }
      } else ln(e, t, n, l)
      break
    case 23:
      break
    case 22:
      ;(a = t.stateNode),
        t.memoizedState !== null
          ? a._visibility & 4
            ? ln(e, t, n, l)
            : Bu(e, t)
          : a._visibility & 4
          ? ln(e, t, n, l)
          : ((a._visibility |= 4), yl(e, t, n, l, (t.subtreeFlags & 10256) !== 0)),
        u & 2048 && Wf(t.alternate, t)
      break
    case 24:
      ln(e, t, n, l), u & 2048 && Pf(t.alternate, t)
      break
    default:
      ln(e, t, n, l)
  }
}
function yl(e, t, n, l, u) {
  for (u = u && (t.subtreeFlags & 10256) !== 0, t = t.child; t !== null; ) {
    var a = e,
      i = t,
      r = n,
      c = l,
      f = i.flags
    switch (i.tag) {
      case 0:
      case 11:
      case 15:
        yl(a, i, r, c, u), pa(8, i)
        break
      case 23:
        break
      case 22:
        var o = i.stateNode
        i.memoizedState !== null
          ? o._visibility & 4
            ? yl(a, i, r, c, u)
            : Bu(a, i)
          : ((o._visibility |= 4), yl(a, i, r, c, u)),
          u && f & 2048 && Wf(i.alternate, i)
        break
      case 24:
        yl(a, i, r, c, u), u && f & 2048 && Pf(i.alternate, i)
        break
      default:
        yl(a, i, r, c, u)
    }
    t = t.sibling
  }
}
function Bu(e, t) {
  if (t.subtreeFlags & 10256)
    for (t = t.child; t !== null; ) {
      var n = e,
        l = t,
        u = l.flags
      switch (l.tag) {
        case 22:
          Bu(n, l), u & 2048 && Wf(l.alternate, l)
          break
        case 24:
          Bu(n, l), u & 2048 && Pf(l.alternate, l)
          break
        default:
          Bu(n, l)
      }
      t = t.sibling
    }
}
var wu = 8192
function hl(e) {
  if (e.subtreeFlags & wu) for (e = e.child; e !== null; ) jh(e), (e = e.sibling)
}
function jh(e) {
  switch (e.tag) {
    case 26:
      hl(e), e.flags & wu && e.memoizedState !== null && Uy(pt, e.memoizedState, e.memoizedProps)
      break
    case 5:
      hl(e)
      break
    case 3:
    case 4:
      var t = pt
      ;(pt = Mi(e.stateNode.containerInfo)), hl(e), (pt = t)
      break
    case 22:
      e.memoizedState === null &&
        ((t = e.alternate),
        t !== null && t.memoizedState !== null
          ? ((t = wu), (wu = 16777216), hl(e), (wu = t))
          : hl(e))
      break
    default:
      hl(e)
  }
}
function qh(e) {
  var t = e.alternate
  if (t !== null && ((e = t.child), e !== null)) {
    t.child = null
    do (t = e.sibling), (e.sibling = null), (e = t)
    while (e !== null)
  }
}
function pu(e) {
  var t = e.deletions
  if (e.flags & 16) {
    if (t !== null)
      for (var n = 0; n < t.length; n++) {
        var l = t[n]
        ;(Ae = l), $h(l, e)
      }
    qh(e)
  }
  if (e.subtreeFlags & 10256) for (e = e.child; e !== null; ) Bh(e), (e = e.sibling)
}
function Bh(e) {
  switch (e.tag) {
    case 0:
    case 11:
    case 15:
      pu(e), e.flags & 2048 && Rn(9, e, e.return)
      break
    case 3:
      pu(e)
      break
    case 12:
      pu(e)
      break
    case 22:
      var t = e.stateNode
      e.memoizedState !== null && t._visibility & 4 && (e.return === null || e.return.tag !== 13)
        ? ((t._visibility &= -5), Ia(e))
        : pu(e)
      break
    default:
      pu(e)
  }
}
function Ia(e) {
  var t = e.deletions
  if (e.flags & 16) {
    if (t !== null)
      for (var n = 0; n < t.length; n++) {
        var l = t[n]
        ;(Ae = l), $h(l, e)
      }
    qh(e)
  }
  for (e = e.child; e !== null; ) {
    switch (((t = e), t.tag)) {
      case 0:
      case 11:
      case 15:
        Rn(8, t, t.return), Ia(t)
        break
      case 22:
        ;(n = t.stateNode), n._visibility & 4 && ((n._visibility &= -5), Ia(t))
        break
      default:
        Ia(t)
    }
    e = e.sibling
  }
}
function $h(e, t) {
  for (; Ae !== null; ) {
    var n = Ae
    switch (n.tag) {
      case 0:
      case 11:
      case 15:
        Rn(8, n, t)
        break
      case 23:
      case 22:
        if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
          var l = n.memoizedState.cachePool.pool
          l != null && l.refCount++
        }
        break
      case 24:
        ha(n.memoizedState.cache)
    }
    if (((l = n.child), l !== null)) (l.return = n), (Ae = l)
    else
      e: for (n = e; Ae !== null; ) {
        l = Ae
        var u = l.sibling,
          a = l.return
        if ((Ch(l), l === n)) {
          Ae = null
          break e
        }
        if (u !== null) {
          ;(u.return = a), (Ae = u)
          break e
        }
        Ae = a
      }
  }
}
function K0(e, t, n, l) {
  ;(this.tag = e),
    (this.key = n),
    (this.sibling =
      this.child =
      this.return =
      this.stateNode =
      this.type =
      this.elementType =
        null),
    (this.index = 0),
    (this.refCleanup = this.ref = null),
    (this.pendingProps = t),
    (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
    (this.mode = l),
    (this.subtreeFlags = this.flags = 0),
    (this.deletions = null),
    (this.childLanes = this.lanes = 0),
    (this.alternate = null)
}
function mt(e, t, n, l) {
  return new K0(e, t, n, l)
}
function If(e) {
  return (e = e.prototype), !(!e || !e.isReactComponent)
}
function En(e, t) {
  var n = e.alternate
  return (
    n === null
      ? ((n = mt(e.tag, t, e.key, e.mode)),
        (n.elementType = e.elementType),
        (n.type = e.type),
        (n.stateNode = e.stateNode),
        (n.alternate = e),
        (e.alternate = n))
      : ((n.pendingProps = t),
        (n.type = e.type),
        (n.flags = 0),
        (n.subtreeFlags = 0),
        (n.deletions = null)),
    (n.flags = e.flags & 31457280),
    (n.childLanes = e.childLanes),
    (n.lanes = e.lanes),
    (n.child = e.child),
    (n.memoizedProps = e.memoizedProps),
    (n.memoizedState = e.memoizedState),
    (n.updateQueue = e.updateQueue),
    (t = e.dependencies),
    (n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
    (n.sibling = e.sibling),
    (n.index = e.index),
    (n.ref = e.ref),
    (n.refCleanup = e.refCleanup),
    n
  )
}
function Yh(e, t) {
  e.flags &= 31457282
  var n = e.alternate
  return (
    n === null
      ? ((e.childLanes = 0),
        (e.lanes = t),
        (e.child = null),
        (e.subtreeFlags = 0),
        (e.memoizedProps = null),
        (e.memoizedState = null),
        (e.updateQueue = null),
        (e.dependencies = null),
        (e.stateNode = null))
      : ((e.childLanes = n.childLanes),
        (e.lanes = n.lanes),
        (e.child = n.child),
        (e.subtreeFlags = 0),
        (e.deletions = null),
        (e.memoizedProps = n.memoizedProps),
        (e.memoizedState = n.memoizedState),
        (e.updateQueue = n.updateQueue),
        (e.type = n.type),
        (t = n.dependencies),
        (e.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext })),
    e
  )
}
function ei(e, t, n, l, u, a) {
  var i = 0
  if (((l = e), typeof e == 'function')) If(e) && (i = 1)
  else if (typeof e == 'string')
    i = Hy(e, n, At.current) ? 26 : e === 'html' || e === 'head' || e === 'body' ? 27 : 5
  else
    e: switch (e) {
      case El:
        return Fn(n.children, u, a, t)
      case Gd:
        ;(i = 8), (u |= 24)
        break
      case fc:
        return (e = mt(12, n, t, u | 2)), (e.elementType = fc), (e.lanes = a), e
      case oc:
        return (e = mt(13, n, t, u)), (e.elementType = oc), (e.lanes = a), e
      case sc:
        return (e = mt(19, n, t, u)), (e.elementType = sc), (e.lanes = a), e
      case Qd:
        return Gh(n, u, a, t)
      default:
        if (typeof e == 'object' && e !== null)
          switch (e.$$typeof) {
            case Ep:
            case Gt:
              i = 10
              break e
            case Xd:
              i = 9
              break e
            case Ef:
              i = 11
              break e
            case Sf:
              i = 14
              break e
            case an:
              ;(i = 16), (l = null)
              break e
          }
        ;(i = 29), (n = Error(T(130, e === null ? 'null' : typeof e, ''))), (l = null)
    }
  return (t = mt(i, n, t, u)), (t.elementType = e), (t.type = l), (t.lanes = a), t
}
function Fn(e, t, n, l) {
  return (e = mt(7, e, l, t)), (e.lanes = n), e
}
function Gh(e, t, n, l) {
  ;(e = mt(22, e, l, t)), (e.elementType = Qd), (e.lanes = n)
  var u = {
    _visibility: 1,
    _pendingVisibility: 1,
    _pendingMarkers: null,
    _retryCache: null,
    _transitions: null,
    _current: null,
    detach: function () {
      var a = u._current
      if (a === null) throw Error(T(456))
      if (!(u._pendingVisibility & 2)) {
        var i = wn(a, 2)
        i !== null && ((u._pendingVisibility |= 2), Xe(i, a, 2))
      }
    },
    attach: function () {
      var a = u._current
      if (a === null) throw Error(T(456))
      if (u._pendingVisibility & 2) {
        var i = wn(a, 2)
        i !== null && ((u._pendingVisibility &= -3), Xe(i, a, 2))
      }
    }
  }
  return (e.stateNode = u), e
}
function Yr(e, t, n) {
  return (e = mt(6, e, null, t)), (e.lanes = n), e
}
function Gr(e, t, n) {
  return (
    (t = mt(4, e.children !== null ? e.children : [], e.key, t)),
    (t.lanes = n),
    (t.stateNode = {
      containerInfo: e.containerInfo,
      pendingChildren: null,
      implementation: e.implementation
    }),
    t
  )
}
function qt(e) {
  e.flags |= 4
}
function Ms(e, t) {
  if (t.type !== 'stylesheet' || t.state.loading & 4) e.flags &= -16777217
  else if (((e.flags |= 16777216), !fg(t))) {
    if (
      ((t = gt.current),
      t !== null &&
        ((Z & 4194176) === Z
          ? Mt !== null
          : ((Z & 62914560) !== Z && !(Z & 536870912)) || t !== Mt))
    )
      throw ((Nu = Oc), Mm)
    e.flags |= 8192
  }
}
function qa(e, t) {
  t !== null && (e.flags |= 4),
    e.flags & 16384 && ((t = e.tag !== 22 ? Wd() : 536870912), (e.lanes |= t), (kl |= t))
}
function yu(e, t) {
  if (!F)
    switch (e.tailMode) {
      case 'hidden':
        t = e.tail
        for (var n = null; t !== null; ) t.alternate !== null && (n = t), (t = t.sibling)
        n === null ? (e.tail = null) : (n.sibling = null)
        break
      case 'collapsed':
        n = e.tail
        for (var l = null; n !== null; ) n.alternate !== null && (l = n), (n = n.sibling)
        l === null
          ? t || e.tail === null
            ? (e.tail = null)
            : (e.tail.sibling = null)
          : (l.sibling = null)
    }
}
function ce(e) {
  var t = e.alternate !== null && e.alternate.child === e.child,
    n = 0,
    l = 0
  if (t)
    for (var u = e.child; u !== null; )
      (n |= u.lanes | u.childLanes),
        (l |= u.subtreeFlags & 31457280),
        (l |= u.flags & 31457280),
        (u.return = e),
        (u = u.sibling)
  else
    for (u = e.child; u !== null; )
      (n |= u.lanes | u.childLanes),
        (l |= u.subtreeFlags),
        (l |= u.flags),
        (u.return = e),
        (u = u.sibling)
  return (e.subtreeFlags |= l), (e.childLanes = n), t
}
function J0(e, t, n) {
  var l = t.pendingProps
  switch ((zf(t), t.tag)) {
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return ce(t), null
    case 1:
      return ce(t), null
    case 3:
      return (
        (n = t.stateNode),
        (l = null),
        e !== null && (l = e.memoizedState.cache),
        t.memoizedState.cache !== l && (t.flags |= 2048),
        kt(xe),
        Yl(),
        n.pendingContext && ((n.context = n.pendingContext), (n.pendingContext = null)),
        (e === null || e.child === null) &&
          (gu(t)
            ? qt(t)
            : e === null ||
              (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
              ((t.flags |= 1024), yt !== null && (Vc(yt), (yt = null)))),
        ce(t),
        null
      )
    case 26:
      return (
        (n = t.memoizedState),
        e === null
          ? (qt(t), n !== null ? (ce(t), Ms(t, n)) : (ce(t), (t.flags &= -16777217)))
          : n
          ? n !== e.memoizedState
            ? (qt(t), ce(t), Ms(t, n))
            : (ce(t), (t.flags &= -16777217))
          : (e.memoizedProps !== l && qt(t), ce(t), (t.flags &= -16777217)),
        null
      )
    case 27:
      ri(t), (n = pn.current)
      var u = t.type
      if (e !== null && t.stateNode != null) e.memoizedProps !== l && qt(t)
      else {
        if (!l) {
          if (t.stateNode === null) throw Error(T(166))
          return ce(t), null
        }
        ;(e = At.current), gu(t) ? us(t) : ((e = ig(u, l, n)), (t.stateNode = e), qt(t))
      }
      return ce(t), null
    case 5:
      if ((ri(t), (n = t.type), e !== null && t.stateNode != null)) e.memoizedProps !== l && qt(t)
      else {
        if (!l) {
          if (t.stateNode === null) throw Error(T(166))
          return ce(t), null
        }
        if (((e = At.current), gu(t))) us(t)
        else {
          switch (((u = Ri(pn.current)), e)) {
            case 1:
              e = u.createElementNS('http://www.w3.org/2000/svg', n)
              break
            case 2:
              e = u.createElementNS('http://www.w3.org/1998/Math/MathML', n)
              break
            default:
              switch (n) {
                case 'svg':
                  e = u.createElementNS('http://www.w3.org/2000/svg', n)
                  break
                case 'math':
                  e = u.createElementNS('http://www.w3.org/1998/Math/MathML', n)
                  break
                case 'script':
                  ;(e = u.createElement('div')),
                    (e.innerHTML = '<script></script>'),
                    (e = e.removeChild(e.firstChild))
                  break
                case 'select':
                  ;(e =
                    typeof l.is == 'string'
                      ? u.createElement('select', { is: l.is })
                      : u.createElement('select')),
                    l.multiple ? (e.multiple = !0) : l.size && (e.size = l.size)
                  break
                default:
                  e =
                    typeof l.is == 'string' ? u.createElement(n, { is: l.is }) : u.createElement(n)
              }
          }
          ;(e[je] = t), (e[Fe] = l)
          e: for (u = t.child; u !== null; ) {
            if (u.tag === 5 || u.tag === 6) e.appendChild(u.stateNode)
            else if (u.tag !== 4 && u.tag !== 27 && u.child !== null) {
              ;(u.child.return = u), (u = u.child)
              continue
            }
            if (u === t) break e
            for (; u.sibling === null; ) {
              if (u.return === null || u.return === t) break e
              u = u.return
            }
            ;(u.sibling.return = u.return), (u = u.sibling)
          }
          t.stateNode = e
          e: switch ((ze(e, n, l), n)) {
            case 'button':
            case 'input':
            case 'select':
            case 'textarea':
              e = !!l.autoFocus
              break e
            case 'img':
              e = !0
              break e
            default:
              e = !1
          }
          e && qt(t)
        }
      }
      return ce(t), (t.flags &= -16777217), null
    case 6:
      if (e && t.stateNode != null) e.memoizedProps !== l && qt(t)
      else {
        if (typeof l != 'string' && t.stateNode === null) throw Error(T(166))
        if (((e = pn.current), gu(t))) {
          if (((e = t.stateNode), (n = t.memoizedProps), (l = null), (u = Be), u !== null))
            switch (u.tag) {
              case 27:
              case 5:
                l = u.memoizedProps
            }
          ;(e[je] = t),
            (e = !!(
              e.nodeValue === n ||
              (l !== null && l.suppressHydrationWarning === !0) ||
              lg(e.nodeValue, n)
            )),
            e || Pn(t)
        } else (e = Ri(e).createTextNode(l)), (e[je] = t), (t.stateNode = e)
      }
      return ce(t), null
    case 13:
      if (
        ((l = t.memoizedState),
        e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
      ) {
        if (((u = gu(t)), l !== null && l.dehydrated !== null)) {
          if (e === null) {
            if (!u) throw Error(T(318))
            if (((u = t.memoizedState), (u = u !== null ? u.dehydrated : null), !u))
              throw Error(T(317))
            u[je] = t
          } else ma(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4)
          ce(t), (u = !1)
        } else yt !== null && (Vc(yt), (yt = null)), (u = !0)
        if (!u) return t.flags & 256 ? (Vt(t), t) : (Vt(t), null)
      }
      if ((Vt(t), t.flags & 128)) return (t.lanes = n), t
      if (((n = l !== null), (e = e !== null && e.memoizedState !== null), n)) {
        ;(l = t.child),
          (u = null),
          l.alternate !== null &&
            l.alternate.memoizedState !== null &&
            l.alternate.memoizedState.cachePool !== null &&
            (u = l.alternate.memoizedState.cachePool.pool)
        var a = null
        l.memoizedState !== null &&
          l.memoizedState.cachePool !== null &&
          (a = l.memoizedState.cachePool.pool),
          a !== u && (l.flags |= 2048)
      }
      return n !== e && n && (t.child.flags |= 8192), qa(t, t.updateQueue), ce(t), null
    case 4:
      return Yl(), e === null && ao(t.stateNode.containerInfo), ce(t), null
    case 10:
      return kt(t.type), ce(t), null
    case 19:
      if ((De(Te), (u = t.memoizedState), u === null)) return ce(t), null
      if (((l = (t.flags & 128) !== 0), (a = u.rendering), a === null))
        if (l) yu(u, !1)
        else {
          if (de !== 0 || (e !== null && e.flags & 128))
            for (e = t.child; e !== null; ) {
              if (((a = gi(e)), a !== null)) {
                for (
                  t.flags |= 128,
                    yu(u, !1),
                    e = a.updateQueue,
                    t.updateQueue = e,
                    qa(t, e),
                    t.subtreeFlags = 0,
                    e = n,
                    n = t.child;
                  n !== null;

                )
                  Yh(n, e), (n = n.sibling)
                return re(Te, (Te.current & 1) | 2), t.child
              }
              e = e.sibling
            }
          u.tail !== null &&
            Rt() > xi &&
            ((t.flags |= 128), (l = !0), yu(u, !1), (t.lanes = 4194304))
        }
      else {
        if (!l)
          if (((e = gi(a)), e !== null)) {
            if (
              ((t.flags |= 128),
              (l = !0),
              (e = e.updateQueue),
              (t.updateQueue = e),
              qa(t, e),
              yu(u, !0),
              u.tail === null && u.tailMode === 'hidden' && !a.alternate && !F)
            )
              return ce(t), null
          } else
            2 * Rt() - u.renderingStartTime > xi &&
              n !== 536870912 &&
              ((t.flags |= 128), (l = !0), yu(u, !1), (t.lanes = 4194304))
        u.isBackwards
          ? ((a.sibling = t.child), (t.child = a))
          : ((e = u.last), e !== null ? (e.sibling = a) : (t.child = a), (u.last = a))
      }
      return u.tail !== null
        ? ((t = u.tail),
          (u.rendering = t),
          (u.tail = t.sibling),
          (u.renderingStartTime = Rt()),
          (t.sibling = null),
          (e = Te.current),
          re(Te, l ? (e & 1) | 2 : e & 1),
          t)
        : (ce(t), null)
    case 22:
    case 23:
      return (
        Vt(t),
        Hf(),
        (l = t.memoizedState !== null),
        e !== null ? (e.memoizedState !== null) !== l && (t.flags |= 8192) : l && (t.flags |= 8192),
        l
          ? n & 536870912 && !(t.flags & 128) && (ce(t), t.subtreeFlags & 6 && (t.flags |= 8192))
          : ce(t),
        (n = t.updateQueue),
        n !== null && qa(t, n.retryQueue),
        (n = null),
        e !== null &&
          e.memoizedState !== null &&
          e.memoizedState.cachePool !== null &&
          (n = e.memoizedState.cachePool.pool),
        (l = null),
        t.memoizedState !== null &&
          t.memoizedState.cachePool !== null &&
          (l = t.memoizedState.cachePool.pool),
        l !== n && (t.flags |= 2048),
        e !== null && De(kn),
        null
      )
    case 24:
      return (
        (n = null),
        e !== null && (n = e.memoizedState.cache),
        t.memoizedState.cache !== n && (t.flags |= 2048),
        kt(xe),
        ce(t),
        null
      )
    case 25:
      return null
  }
  throw Error(T(156, t.tag))
}
function W0(e, t) {
  switch ((zf(t), t.tag)) {
    case 1:
      return (e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
    case 3:
      return (
        kt(xe),
        Yl(),
        (e = t.flags),
        e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null
      )
    case 26:
    case 27:
    case 5:
      return ri(t), null
    case 13:
      if ((Vt(t), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
        if (t.alternate === null) throw Error(T(340))
        ma()
      }
      return (e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
    case 19:
      return De(Te), null
    case 4:
      return Yl(), null
    case 10:
      return kt(t.type), null
    case 22:
    case 23:
      return (
        Vt(t),
        Hf(),
        e !== null && De(kn),
        (e = t.flags),
        e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
      )
    case 24:
      return kt(xe), null
    case 25:
      return null
    default:
      return null
  }
}
function Xh(e, t) {
  switch ((zf(t), t.tag)) {
    case 3:
      kt(xe), Yl()
      break
    case 26:
    case 27:
    case 5:
      ri(t)
      break
    case 4:
      Yl()
      break
    case 13:
      Vt(t)
      break
    case 19:
      De(Te)
      break
    case 10:
      kt(t.type)
      break
    case 22:
    case 23:
      Vt(t), Hf(), e !== null && De(kn)
      break
    case 24:
      kt(xe)
  }
}
var P0 = {
    getCacheForType: function (e) {
      var t = qe(xe),
        n = t.data.get(e)
      return n === void 0 && ((n = e()), t.data.set(e, n)), n
    }
  },
  I0 = typeof WeakMap == 'function' ? WeakMap : Map,
  oe = 0,
  te = null,
  G = null,
  Z = 0,
  ee = 0,
  We = null,
  $t = !1,
  lu = !1,
  eo = !1,
  Pt = 0,
  de = 0,
  Mn = 0,
  Kn = 0,
  to = 0,
  ht = 0,
  kl = 0,
  $u = null,
  wt = null,
  Yc = !1,
  no = 0,
  xi = 1 / 0,
  Ti = null,
  Sn = null,
  Ba = !1,
  Bn = null,
  Yu = 0,
  Gc = 0,
  Xc = null,
  Gu = 0,
  Qc = null
function tt() {
  if (oe & 2 && Z !== 0) return Z & -Z
  if (B.T !== null) {
    var e = Vl
    return e !== 0 ? e : uo()
  }
  return tm()
}
function Qh() {
  ht === 0 && (ht = !(Z & 536870912) || F ? Jd() : 536870912)
  var e = gt.current
  return e !== null && (e.flags |= 32), ht
}
function Xe(e, t, n) {
  ;((e === te && ee === 2) || e.cancelPendingCommit !== null) && (Fl(e, 0), Yt(e, Z, ht, !1)),
    sa(e, n),
    (!(oe & 2) || e !== te) &&
      (e === te && (!(oe & 2) && (Kn |= n), de === 4 && Yt(e, Z, ht, !1)), zt(e))
}
function Vh(e, t, n) {
  if (oe & 6) throw Error(T(327))
  var l = (!n && (t & 60) === 0 && (t & e.expiredLanes) === 0) || oa(e, t),
    u = l ? ny(e, t) : Xr(e, t, !0),
    a = l
  do {
    if (u === 0) {
      lu && !l && Yt(e, t, 0, !1)
      break
    } else if (u === 6) Yt(e, t, 0, !$t)
    else {
      if (((n = e.current.alternate), a && !ey(n))) {
        ;(u = Xr(e, t, !1)), (a = !1)
        continue
      }
      if (u === 2) {
        if (((a = t), e.errorRecoveryDisabledLanes & a)) var i = 0
        else (i = e.pendingLanes & -536870913), (i = i !== 0 ? i : i & 536870912 ? 536870912 : 0)
        if (i !== 0) {
          t = i
          e: {
            var r = e
            u = $u
            var c = r.current.memoizedState.isDehydrated
            if ((c && (Fl(r, i).flags |= 256), (i = Xr(r, i, !1)), i !== 2)) {
              if (eo && !c) {
                ;(r.errorRecoveryDisabledLanes |= a), (Kn |= a), (u = 4)
                break e
              }
              ;(a = wt), (wt = u), a !== null && Vc(a)
            }
            u = i
          }
          if (((a = !1), u !== 2)) continue
        }
      }
      if (u === 1) {
        Fl(e, 0), Yt(e, t, 0, !0)
        break
      }
      e: {
        switch (((l = e), u)) {
          case 0:
          case 1:
            throw Error(T(345))
          case 4:
            if ((t & 4194176) === t) {
              Yt(l, t, ht, !$t)
              break e
            }
            break
          case 2:
            wt = null
            break
          case 3:
          case 5:
            break
          default:
            throw Error(T(329))
        }
        if (
          ((l.finishedWork = n),
          (l.finishedLanes = t),
          (t & 62914560) === t && ((a = no + 300 - Rt()), 10 < a))
        ) {
          if ((Yt(l, t, ht, !$t), Gi(l, 0) !== 0)) break e
          l.timeoutHandle = ag(Ds.bind(null, l, n, wt, Ti, Yc, t, ht, Kn, kl, $t, 2, -0, 0), a)
          break e
        }
        Ds(l, n, wt, Ti, Yc, t, ht, Kn, kl, $t, 0, -0, 0)
      }
    }
    break
  } while (!0)
  zt(e)
}
function Vc(e) {
  wt === null ? (wt = e) : wt.push.apply(wt, e)
}
function Ds(e, t, n, l, u, a, i, r, c, f, o, g, m) {
  var s = t.subtreeFlags
  if (
    (s & 8192 || (s & 16785408) === 16785408) &&
    ((ta = { stylesheets: null, count: 0, unsuspend: Ly }), jh(t), (t = jy()), t !== null)
  ) {
    ;(e.cancelPendingCommit = t(Cs.bind(null, e, n, l, u, i, r, c, 1, g, m))), Yt(e, a, i, !f)
    return
  }
  Cs(e, n, l, u, i, r, c, o, g, m)
}
function ey(e) {
  for (var t = e; ; ) {
    var n = t.tag
    if (
      (n === 0 || n === 11 || n === 15) &&
      t.flags & 16384 &&
      ((n = t.updateQueue), n !== null && ((n = n.stores), n !== null))
    )
      for (var l = 0; l < n.length; l++) {
        var u = n[l],
          a = u.getSnapshot
        u = u.value
        try {
          if (!lt(a(), u)) return !1
        } catch {
          return !1
        }
      }
    if (((n = t.child), t.subtreeFlags & 16384 && n !== null)) (n.return = t), (t = n)
    else {
      if (t === e) break
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0
        t = t.return
      }
      ;(t.sibling.return = t.return), (t = t.sibling)
    }
  }
  return !0
}
function Yt(e, t, n, l) {
  ;(t &= ~to),
    (t &= ~Kn),
    (e.suspendedLanes |= t),
    (e.pingedLanes &= ~t),
    l && (e.warmLanes |= t),
    (l = e.expirationTimes)
  for (var u = t; 0 < u; ) {
    var a = 31 - et(u),
      i = 1 << a
    ;(l[a] = -1), (u &= ~i)
  }
  n !== 0 && Pd(e, n, t)
}
function Pi() {
  return oe & 6 ? !0 : (ya(0), !1)
}
function lo() {
  if (G !== null) {
    if (ee === 0) var e = G.return
    else (e = G), (Zt = dl = null), Yf(e), (Hl = null), (Wu = 0), (e = G)
    for (; e !== null; ) Xh(e.alternate, e), (e = e.return)
    G = null
  }
}
function Fl(e, t) {
  ;(e.finishedWork = null), (e.finishedLanes = 0)
  var n = e.timeoutHandle
  n !== -1 && ((e.timeoutHandle = -1), by(n)),
    (n = e.cancelPendingCommit),
    n !== null && ((e.cancelPendingCommit = null), n()),
    lo(),
    (te = e),
    (G = n = En(e.current, null)),
    (Z = t),
    (ee = 0),
    (We = null),
    ($t = !1),
    (lu = oa(e, t)),
    (eo = !1),
    (kl = ht = to = Kn = Mn = de = 0),
    (wt = $u = null),
    (Yc = !1),
    t & 8 && (t |= t & 32)
  var l = e.entangledLanes
  if (l !== 0)
    for (e = e.entanglements, l &= t; 0 < l; ) {
      var u = 31 - et(l),
        a = 1 << u
      ;(t |= e[u]), (l &= ~a)
    }
  return (Pt = t), Zi(), n
}
function Zh(e, t) {
  ;(Y = null),
    (B.H = _t),
    t === Cu
      ? ((t = rs()), (ee = 3))
      : t === Mm
      ? ((t = rs()), (ee = 4))
      : (ee =
          t === ph ? 8 : t !== null && typeof t == 'object' && typeof t.then == 'function' ? 6 : 1),
    (We = t),
    G === null && ((de = 1), bi(e, dt(t, e.current)))
}
function kh() {
  var e = B.H
  return (B.H = _t), e === null ? _t : e
}
function Fh() {
  var e = B.A
  return (B.A = P0), e
}
function Zc() {
  ;(de = 4),
    $t || ((Z & 4194176) !== Z && gt.current !== null) || (lu = !0),
    (!(Mn & 134217727) && !(Kn & 134217727)) || te === null || Yt(te, Z, ht, !1)
}
function Xr(e, t, n) {
  var l = oe
  oe |= 2
  var u = kh(),
    a = Fh()
  ;(te !== e || Z !== t) && ((Ti = null), Fl(e, t)), (t = !1)
  var i = de
  e: do
    try {
      if (ee !== 0 && G !== null) {
        var r = G,
          c = We
        switch (ee) {
          case 8:
            lo(), (i = 6)
            break e
          case 3:
          case 2:
          case 6:
            gt.current === null && (t = !0)
            var f = ee
            if (((ee = 0), (We = null), _l(e, r, c, f), n && lu)) {
              i = 0
              break e
            }
            break
          default:
            ;(f = ee), (ee = 0), (We = null), _l(e, r, c, f)
        }
      }
      ty(), (i = de)
      break
    } catch (o) {
      Zh(e, o)
    }
  while (!0)
  return (
    t && e.shellSuspendCounter++,
    (Zt = dl = null),
    (oe = l),
    (B.H = u),
    (B.A = a),
    G === null && ((te = null), (Z = 0), Zi()),
    i
  )
}
function ty() {
  for (; G !== null; ) Kh(G)
}
function ny(e, t) {
  var n = oe
  oe |= 2
  var l = kh(),
    u = Fh()
  te !== e || Z !== t ? ((Ti = null), (xi = Rt() + 500), Fl(e, t)) : (lu = oa(e, t))
  e: do
    try {
      if (ee !== 0 && G !== null) {
        t = G
        var a = We
        t: switch (ee) {
          case 1:
            ;(ee = 0), (We = null), _l(e, t, a, 1)
            break
          case 2:
            if (is(a)) {
              ;(ee = 0), (We = null), _s(t)
              break
            }
            ;(t = function () {
              ee === 2 && te === e && (ee = 7), zt(e)
            }),
              a.then(t, t)
            break e
          case 3:
            ee = 7
            break e
          case 4:
            ee = 5
            break e
          case 7:
            is(a) ? ((ee = 0), (We = null), _s(t)) : ((ee = 0), (We = null), _l(e, t, a, 7))
            break
          case 5:
            var i = null
            switch (G.tag) {
              case 26:
                i = G.memoizedState
              case 5:
              case 27:
                var r = G
                if (!i || fg(i)) {
                  ;(ee = 0), (We = null)
                  var c = r.sibling
                  if (c !== null) G = c
                  else {
                    var f = r.return
                    f !== null ? ((G = f), Ii(f)) : (G = null)
                  }
                  break t
                }
            }
            ;(ee = 0), (We = null), _l(e, t, a, 5)
            break
          case 6:
            ;(ee = 0), (We = null), _l(e, t, a, 6)
            break
          case 8:
            lo(), (de = 6)
            break e
          default:
            throw Error(T(462))
        }
      }
      ly()
      break
    } catch (o) {
      Zh(e, o)
    }
  while (!0)
  return (
    (Zt = dl = null),
    (B.H = l),
    (B.A = u),
    (oe = n),
    G !== null ? 0 : ((te = null), (Z = 0), Zi(), de)
  )
}
function ly() {
  for (; G !== null && !wp(); ) Kh(G)
}
function Kh(e) {
  var t = xh(e.alternate, e, Pt)
  ;(e.memoizedProps = e.pendingProps), t === null ? Ii(e) : (G = t)
}
function _s(e) {
  var t = e,
    n = t.alternate
  switch (t.tag) {
    case 15:
    case 0:
      t = Ss(n, t, t.pendingProps, t.type, void 0, Z)
      break
    case 11:
      t = Ss(n, t, t.pendingProps, t.type.render, t.ref, Z)
      break
    case 5:
      Yf(t)
    default:
      Xh(n, t), (t = G = Yh(t, Pt)), (t = xh(n, t, Pt))
  }
  ;(e.memoizedProps = e.pendingProps), t === null ? Ii(e) : (G = t)
}
function _l(e, t, n, l) {
  ;(Zt = dl = null), Yf(t), (Hl = null), (Wu = 0)
  var u = t.return
  try {
    if (V0(e, u, t, n, Z)) {
      ;(de = 1), bi(e, dt(n, e.current)), (G = null)
      return
    }
  } catch (a) {
    if (u !== null) throw ((G = u), a)
    ;(de = 1), bi(e, dt(n, e.current)), (G = null)
    return
  }
  t.flags & 32768
    ? (F || l === 1
        ? (e = !0)
        : lu || Z & 536870912
        ? (e = !1)
        : (($t = e = !0),
          (l === 2 || l === 3 || l === 6) &&
            ((l = gt.current), l !== null && l.tag === 13 && (l.flags |= 16384))),
      Jh(t, e))
    : Ii(t)
}
function Ii(e) {
  var t = e
  do {
    if (t.flags & 32768) {
      Jh(t, $t)
      return
    }
    e = t.return
    var n = J0(t.alternate, t, Pt)
    if (n !== null) {
      G = n
      return
    }
    if (((t = t.sibling), t !== null)) {
      G = t
      return
    }
    G = t = e
  } while (t !== null)
  de === 0 && (de = 5)
}
function Jh(e, t) {
  do {
    var n = W0(e.alternate, e)
    if (n !== null) {
      ;(n.flags &= 32767), (G = n)
      return
    }
    if (
      ((n = e.return),
      n !== null && ((n.flags |= 32768), (n.subtreeFlags = 0), (n.deletions = null)),
      !t && ((e = e.sibling), e !== null))
    ) {
      G = e
      return
    }
    G = e = n
  } while (e !== null)
  ;(de = 6), (G = null)
}
function Cs(e, t, n, l, u, a, i, r, c, f) {
  var o = B.T,
    g = ne.p
  try {
    ;(ne.p = 2), (B.T = null), uy(e, t, n, l, g, u, a, i, r, c, f)
  } finally {
    ;(B.T = o), (ne.p = g)
  }
}
function uy(e, t, n, l, u, a, i, r) {
  do ql()
  while (Bn !== null)
  if (oe & 6) throw Error(T(327))
  var c = e.finishedWork
  if (((l = e.finishedLanes), c === null)) return null
  if (((e.finishedWork = null), (e.finishedLanes = 0), c === e.current)) throw Error(T(177))
  ;(e.callbackNode = null), (e.callbackPriority = 0), (e.cancelPendingCommit = null)
  var f = c.lanes | c.childLanes
  if (
    ((f |= _f),
    Up(e, l, f, a, i, r),
    e === te && ((G = te = null), (Z = 0)),
    (!(c.subtreeFlags & 10256) && !(c.flags & 10256)) ||
      Ba ||
      ((Ba = !0),
      (Gc = f),
      (Xc = n),
      cy(ci, function () {
        return ql(), null
      })),
    (n = (c.flags & 15990) !== 0),
    c.subtreeFlags & 15990 || n
      ? ((n = B.T),
        (B.T = null),
        (a = ne.p),
        (ne.p = 2),
        (i = oe),
        (oe |= 4),
        k0(e, c),
        Hh(c, e),
        M0(Jc, e.containerInfo),
        (Ci = !!Kc),
        (Jc = Kc = null),
        (e.current = c),
        _h(e, c.alternate, c),
        Ap(),
        (oe = i),
        (ne.p = a),
        (B.T = n))
      : (e.current = c),
    Ba ? ((Ba = !1), (Bn = e), (Yu = l)) : Wh(e, f),
    (f = e.pendingLanes),
    f === 0 && (Sn = null),
    Cp(c.stateNode),
    zt(e),
    t !== null)
  )
    for (u = e.onRecoverableError, c = 0; c < t.length; c++)
      (f = t[c]), u(f.value, { componentStack: f.stack })
  return (
    Yu & 3 && ql(),
    (f = e.pendingLanes),
    l & 4194218 && f & 42 ? (e === Qc ? Gu++ : ((Gu = 0), (Qc = e))) : (Gu = 0),
    ya(0),
    null
  )
}
function Wh(e, t) {
  ;(e.pooledCacheLanes &= t) === 0 &&
    ((t = e.pooledCache), t != null && ((e.pooledCache = null), ha(t)))
}
function ql() {
  if (Bn !== null) {
    var e = Bn,
      t = Gc
    Gc = 0
    var n = em(Yu),
      l = B.T,
      u = ne.p
    try {
      if (((ne.p = 32 > n ? 32 : n), (B.T = null), Bn === null)) var a = !1
      else {
        ;(n = Xc), (Xc = null)
        var i = Bn,
          r = Yu
        if (((Bn = null), (Yu = 0), oe & 6)) throw Error(T(331))
        var c = oe
        if (
          ((oe |= 4),
          Bh(i.current),
          Uh(i, i.current, r, n),
          (oe = c),
          ya(0, !1),
          Ie && typeof Ie.onPostCommitFiberRoot == 'function')
        )
          try {
            Ie.onPostCommitFiberRoot(fa, i)
          } catch {}
        a = !0
      }
      return a
    } finally {
      ;(ne.p = u), (B.T = l), Wh(e, t)
    }
  }
  return !1
}
function Ns(e, t, n) {
  ;(t = dt(n, t)), (t = Cc(e.stateNode, t, 2)), (e = bn(e, t, 2)), e !== null && (sa(e, 2), zt(e))
}
function P(e, t, n) {
  if (e.tag === 3) Ns(e, e, n)
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        Ns(t, e, n)
        break
      } else if (t.tag === 1) {
        var l = t.stateNode
        if (
          typeof t.type.getDerivedStateFromError == 'function' ||
          (typeof l.componentDidCatch == 'function' && (Sn === null || !Sn.has(l)))
        ) {
          ;(e = dt(n, e)),
            (n = gh(2)),
            (l = bn(t, n, 2)),
            l !== null && (vh(n, l, t, e), sa(l, 2), zt(l))
          break
        }
      }
      t = t.return
    }
}
function Qr(e, t, n) {
  var l = e.pingCache
  if (l === null) {
    l = e.pingCache = new I0()
    var u = new Set()
    l.set(t, u)
  } else (u = l.get(t)), u === void 0 && ((u = new Set()), l.set(t, u))
  u.has(n) || ((eo = !0), u.add(n), (e = ay.bind(null, e, t, n)), t.then(e, e))
}
function ay(e, t, n) {
  var l = e.pingCache
  l !== null && l.delete(t),
    (e.pingedLanes |= e.suspendedLanes & n),
    (e.warmLanes &= ~n),
    te === e &&
      (Z & n) === n &&
      (de === 4 || (de === 3 && (Z & 62914560) === Z && 300 > Rt() - no)
        ? !(oe & 2) && Fl(e, 0)
        : (to |= n),
      kl === Z && (kl = 0)),
    zt(e)
}
function Ph(e, t) {
  t === 0 && (t = Wd()), (e = wn(e, t)), e !== null && (sa(e, t), zt(e))
}
function iy(e) {
  var t = e.memoizedState,
    n = 0
  t !== null && (n = t.retryLane), Ph(e, n)
}
function ry(e, t) {
  var n = 0
  switch (e.tag) {
    case 13:
      var l = e.stateNode,
        u = e.memoizedState
      u !== null && (n = u.retryLane)
      break
    case 19:
      l = e.stateNode
      break
    case 22:
      l = e.stateNode._retryCache
      break
    default:
      throw Error(T(314))
  }
  l !== null && l.delete(t), Ph(e, n)
}
function cy(e, t) {
  return xf(e, t)
}
var Oi = null,
  bl = null,
  kc = !1,
  wi = !1,
  Vr = !1,
  Jn = 0
function zt(e) {
  e !== bl && e.next === null && (bl === null ? (Oi = bl = e) : (bl = bl.next = e)),
    (wi = !0),
    kc || ((kc = !0), oy(fy))
}
function ya(e, t) {
  if (!Vr && wi) {
    Vr = !0
    do
      for (var n = !1, l = Oi; l !== null; ) {
        if (e !== 0) {
          var u = l.pendingLanes
          if (u === 0) var a = 0
          else {
            var i = l.suspendedLanes,
              r = l.pingedLanes
            ;(a = (1 << (31 - et(42 | e) + 1)) - 1),
              (a &= u & ~(i & ~r)),
              (a = a & 201326677 ? (a & 201326677) | 1 : a ? a | 2 : 0)
          }
          a !== 0 && ((n = !0), zs(l, a))
        } else (a = Z), (a = Gi(l, l === te ? a : 0)), !(a & 3) || oa(l, a) || ((n = !0), zs(l, a))
        l = l.next
      }
    while (n)
    Vr = !1
  }
}
function fy() {
  wi = kc = !1
  var e = 0
  Jn !== 0 && (yy() && (e = Jn), (Jn = 0))
  for (var t = Rt(), n = null, l = Oi; l !== null; ) {
    var u = l.next,
      a = Ih(l, t)
    a === 0
      ? ((l.next = null), n === null ? (Oi = u) : (n.next = u), u === null && (bl = n))
      : ((n = l), (e !== 0 || a & 3) && (wi = !0)),
      (l = u)
  }
  ya(e)
}
function Ih(e, t) {
  for (
    var n = e.suspendedLanes,
      l = e.pingedLanes,
      u = e.expirationTimes,
      a = e.pendingLanes & -62914561;
    0 < a;

  ) {
    var i = 31 - et(a),
      r = 1 << i,
      c = u[i]
    c === -1 ? (!(r & n) || r & l) && (u[i] = Lp(r, t)) : c <= t && (e.expiredLanes |= r), (a &= ~r)
  }
  if (
    ((t = te),
    (n = Z),
    (n = Gi(e, e === t ? n : 0)),
    (l = e.callbackNode),
    n === 0 || (e === t && ee === 2) || e.cancelPendingCommit !== null)
  )
    return l !== null && l !== null && Sr(l), (e.callbackNode = null), (e.callbackPriority = 0)
  if (!(n & 3) || oa(e, n)) {
    if (((t = n & -n), t === e.callbackPriority)) return t
    switch ((l !== null && Sr(l), em(n))) {
      case 2:
      case 8:
        n = Fd
        break
      case 32:
        n = ci
        break
      case 268435456:
        n = Kd
        break
      default:
        n = ci
    }
    return (l = eg.bind(null, e)), (n = xf(n, l)), (e.callbackPriority = t), (e.callbackNode = n), t
  }
  return l !== null && l !== null && Sr(l), (e.callbackPriority = 2), (e.callbackNode = null), 2
}
function eg(e, t) {
  var n = e.callbackNode
  if (ql() && e.callbackNode !== n) return null
  var l = Z
  return (
    (l = Gi(e, e === te ? l : 0)),
    l === 0
      ? null
      : (Vh(e, l, t),
        Ih(e, Rt()),
        e.callbackNode != null && e.callbackNode === n ? eg.bind(null, e) : null)
  )
}
function zs(e, t) {
  if (ql()) return null
  Vh(e, t, !0)
}
function oy(e) {
  Ey(function () {
    oe & 6 ? xf(kd, e) : e()
  })
}
function uo() {
  return Jn === 0 && (Jn = Jd()), Jn
}
function Hs(e) {
  return e == null || typeof e == 'symbol' || typeof e == 'boolean'
    ? null
    : typeof e == 'function'
    ? e
    : ka('' + e)
}
function Ls(e, t) {
  var n = t.ownerDocument.createElement('input')
  return (
    (n.name = t.name),
    (n.value = t.value),
    e.id && n.setAttribute('form', e.id),
    t.parentNode.insertBefore(n, t),
    (e = new FormData(e)),
    n.parentNode.removeChild(n),
    e
  )
}
function sy(e, t, n, l, u) {
  if (t === 'submit' && n && n.stateNode === u) {
    var a = Hs((u[Fe] || null).action),
      i = l.submitter
    i &&
      ((t = (t = i[Fe] || null) ? Hs(t.formAction) : i.getAttribute('formAction')),
      t !== null && ((a = t), (i = null)))
    var r = new Xi('action', 'action', null, l, u)
    e.push({
      event: r,
      listeners: [
        {
          instance: null,
          listener: function () {
            if (l.defaultPrevented) {
              if (Jn !== 0) {
                var c = i ? Ls(u, i) : new FormData(u)
                Dc(n, { pending: !0, data: c, method: u.method, action: a }, null, c)
              }
            } else
              typeof a == 'function' &&
                (r.preventDefault(),
                (c = i ? Ls(u, i) : new FormData(u)),
                Dc(n, { pending: !0, data: c, method: u.method, action: a }, a, c))
          },
          currentTarget: u
        }
      ]
    })
  }
}
for (var Zr = 0; Zr < ns.length; Zr++) {
  var kr = ns[Zr],
    dy = kr.toLowerCase(),
    my = kr[0].toUpperCase() + kr.slice(1)
  xt(dy, 'on' + my)
}
xt(Sm, 'onAnimationEnd')
xt(xm, 'onAnimationIteration')
xt(Tm, 'onAnimationStart')
xt('dblclick', 'onDoubleClick')
xt('focusin', 'onFocus')
xt('focusout', 'onBlur')
xt(_0, 'onTransitionRun')
xt(C0, 'onTransitionStart')
xt(N0, 'onTransitionCancel')
xt(Om, 'onTransitionEnd')
Gl('onMouseEnter', ['mouseout', 'mouseover'])
Gl('onMouseLeave', ['mouseout', 'mouseover'])
Gl('onPointerEnter', ['pointerout', 'pointerover'])
Gl('onPointerLeave', ['pointerout', 'pointerover'])
rl('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '))
rl(
  'onSelect',
  'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(' ')
)
rl('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste'])
rl('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '))
rl('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '))
rl('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '))
var Iu =
    'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
      ' '
    ),
  hy = new Set(
    'beforetoggle cancel close invalid load scroll scrollend toggle'.split(' ').concat(Iu)
  )
function tg(e, t) {
  t = (t & 4) !== 0
  for (var n = 0; n < e.length; n++) {
    var l = e[n],
      u = l.event
    l = l.listeners
    e: {
      var a = void 0
      if (t)
        for (var i = l.length - 1; 0 <= i; i--) {
          var r = l[i],
            c = r.instance,
            f = r.currentTarget
          if (((r = r.listener), c !== a && u.isPropagationStopped())) break e
          ;(a = r), (u.currentTarget = f)
          try {
            a(u)
          } catch (o) {
            yi(o)
          }
          ;(u.currentTarget = null), (a = c)
        }
      else
        for (i = 0; i < l.length; i++) {
          if (
            ((r = l[i]),
            (c = r.instance),
            (f = r.currentTarget),
            (r = r.listener),
            c !== a && u.isPropagationStopped())
          )
            break e
          ;(a = r), (u.currentTarget = f)
          try {
            a(u)
          } catch (o) {
            yi(o)
          }
          ;(u.currentTarget = null), (a = c)
        }
    }
  }
}
function Q(e, t) {
  var n = t[vc]
  n === void 0 && (n = t[vc] = new Set())
  var l = e + '__bubble'
  n.has(l) || (ng(t, e, 2, !1), n.add(l))
}
function Fr(e, t, n) {
  var l = 0
  t && (l |= 4), ng(n, e, l, t)
}
var $a = '_reactListening' + Math.random().toString(36).slice(2)
function ao(e) {
  if (!e[$a]) {
    ;(e[$a] = !0),
      nm.forEach(function (n) {
        n !== 'selectionchange' && (hy.has(n) || Fr(n, !1, e), Fr(n, !0, e))
      })
    var t = e.nodeType === 9 ? e : e.ownerDocument
    t === null || t[$a] || ((t[$a] = !0), Fr('selectionchange', !1, t))
  }
}
function ng(e, t, n, l) {
  switch (hg(t)) {
    case 2:
      var u = $y
      break
    case 8:
      u = Yy
      break
    default:
      u = fo
  }
  ;(n = u.bind(null, t, n, e)),
    (u = void 0),
    !Ec || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (u = !0),
    l
      ? u !== void 0
        ? e.addEventListener(t, n, { capture: !0, passive: u })
        : e.addEventListener(t, n, !0)
      : u !== void 0
      ? e.addEventListener(t, n, { passive: u })
      : e.addEventListener(t, n, !1)
}
function Kr(e, t, n, l, u) {
  var a = l
  if (!(t & 1) && !(t & 2) && l !== null)
    e: for (;;) {
      if (l === null) return
      var i = l.tag
      if (i === 3 || i === 4) {
        var r = l.stateNode.containerInfo
        if (r === u || (r.nodeType === 8 && r.parentNode === u)) break
        if (i === 4)
          for (i = l.return; i !== null; ) {
            var c = i.tag
            if (
              (c === 3 || c === 4) &&
              ((c = i.stateNode.containerInfo), c === u || (c.nodeType === 8 && c.parentNode === u))
            )
              return
            i = i.return
          }
        for (; r !== null; ) {
          if (((i = Yn(r)), i === null)) return
          if (((c = i.tag), c === 5 || c === 6 || c === 26 || c === 27)) {
            l = a = i
            continue e
          }
          r = r.parentNode
        }
      }
      l = l.return
    }
  om(function () {
    var f = a,
      o = wf(n),
      g = []
    e: {
      var m = wm.get(e)
      if (m !== void 0) {
        var s = Xi,
          y = e
        switch (e) {
          case 'keypress':
            if (Ka(n) === 0) break e
          case 'keydown':
          case 'keyup':
            s = r0
            break
          case 'focusin':
            ;(y = 'focus'), (s = Ar)
            break
          case 'focusout':
            ;(y = 'blur'), (s = Ar)
            break
          case 'beforeblur':
          case 'afterblur':
            s = Ar
            break
          case 'click':
            if (n.button === 2) break e
          case 'auxclick':
          case 'dblclick':
          case 'mousedown':
          case 'mousemove':
          case 'mouseup':
          case 'mouseout':
          case 'mouseover':
          case 'contextmenu':
            s = Qo
            break
          case 'drag':
          case 'dragend':
          case 'dragenter':
          case 'dragexit':
          case 'dragleave':
          case 'dragover':
          case 'dragstart':
          case 'drop':
            s = Kp
            break
          case 'touchcancel':
          case 'touchend':
          case 'touchmove':
          case 'touchstart':
            s = o0
            break
          case Sm:
          case xm:
          case Tm:
            s = Pp
            break
          case Om:
            s = d0
            break
          case 'scroll':
          case 'scrollend':
            s = kp
            break
          case 'wheel':
            s = h0
            break
          case 'copy':
          case 'cut':
          case 'paste':
            s = e0
            break
          case 'gotpointercapture':
          case 'lostpointercapture':
          case 'pointercancel':
          case 'pointerdown':
          case 'pointermove':
          case 'pointerout':
          case 'pointerover':
          case 'pointerup':
            s = Zo
            break
          case 'toggle':
          case 'beforetoggle':
            s = v0
        }
        var E = (t & 4) !== 0,
          x = !E && (e === 'scroll' || e === 'scrollend'),
          v = E ? (m !== null ? m + 'Capture' : null) : m
        E = []
        for (var h = f, p; h !== null; ) {
          var b = h
          if (
            ((p = b.stateNode),
            (b = b.tag),
            (b !== 5 && b !== 26 && b !== 27) ||
              p === null ||
              v === null ||
              ((b = ku(h, v)), b != null && E.push(ea(h, b, p))),
            x)
          )
            break
          h = h.return
        }
        0 < E.length && ((m = new s(m, y, null, n, o)), g.push({ event: m, listeners: E }))
      }
    }
    if (!(t & 7)) {
      e: {
        if (
          ((m = e === 'mouseover' || e === 'pointerover'),
          (s = e === 'mouseout' || e === 'pointerout'),
          m && n !== bc && (y = n.relatedTarget || n.fromElement) && (Yn(y) || y[tu]))
        )
          break e
        if (
          (s || m) &&
          ((m =
            o.window === o ? o : (m = o.ownerDocument) ? m.defaultView || m.parentWindow : window),
          s
            ? ((y = n.relatedTarget || n.toElement),
              (s = f),
              (y = y ? Yn(y) : null),
              y !== null &&
                ((x = eu(y)), (E = y.tag), y !== x || (E !== 5 && E !== 27 && E !== 6)) &&
                (y = null))
            : ((s = null), (y = f)),
          s !== y)
        ) {
          if (
            ((E = Qo),
            (b = 'onMouseLeave'),
            (v = 'onMouseEnter'),
            (h = 'mouse'),
            (e === 'pointerout' || e === 'pointerover') &&
              ((E = Zo), (b = 'onPointerLeave'), (v = 'onPointerEnter'), (h = 'pointer')),
            (x = s == null ? m : Ou(s)),
            (p = y == null ? m : Ou(y)),
            (m = new E(b, h + 'leave', s, n, o)),
            (m.target = x),
            (m.relatedTarget = p),
            (b = null),
            Yn(o) === f &&
              ((E = new E(v, h + 'enter', y, n, o)),
              (E.target = p),
              (E.relatedTarget = x),
              (b = E)),
            (x = b),
            s && y)
          )
            t: {
              for (E = s, v = y, h = 0, p = E; p; p = gl(p)) h++
              for (p = 0, b = v; b; b = gl(b)) p++
              for (; 0 < h - p; ) (E = gl(E)), h--
              for (; 0 < p - h; ) (v = gl(v)), p--
              for (; h--; ) {
                if (E === v || (v !== null && E === v.alternate)) break t
                ;(E = gl(E)), (v = gl(v))
              }
              E = null
            }
          else E = null
          s !== null && Us(g, m, s, E, !1), y !== null && x !== null && Us(g, x, y, E, !0)
        }
      }
      e: {
        if (
          ((m = f ? Ou(f) : window),
          (s = m.nodeName && m.nodeName.toLowerCase()),
          s === 'select' || (s === 'input' && m.type === 'file'))
        )
          var S = Jo
        else if (Ko(m))
          if (vm) S = A0
          else {
            S = O0
            var A = T0
          }
        else
          (s = m.nodeName),
            !s || s.toLowerCase() !== 'input' || (m.type !== 'checkbox' && m.type !== 'radio')
              ? f && Of(f.elementType) && (S = Jo)
              : (S = w0)
        if (S && (S = S(e, f))) {
          gm(g, S, n, o)
          break e
        }
        A && A(e, m, f),
          e === 'focusout' &&
            f &&
            m.type === 'number' &&
            f.memoizedProps.value != null &&
            yc(m, 'number', m.value)
      }
      switch (((A = f ? Ou(f) : window), e)) {
        case 'focusin':
          ;(Ko(A) || A.contentEditable === 'true') && ((Ol = A), (Sc = f), (_u = null))
          break
        case 'focusout':
          _u = Sc = Ol = null
          break
        case 'mousedown':
          xc = !0
          break
        case 'contextmenu':
        case 'mouseup':
        case 'dragend':
          ;(xc = !1), ts(g, n, o)
          break
        case 'selectionchange':
          if (D0) break
        case 'keydown':
        case 'keyup':
          ts(g, n, o)
      }
      var O
      if (Mf)
        e: {
          switch (e) {
            case 'compositionstart':
              var M = 'onCompositionStart'
              break e
            case 'compositionend':
              M = 'onCompositionEnd'
              break e
            case 'compositionupdate':
              M = 'onCompositionUpdate'
              break e
          }
          M = void 0
        }
      else
        Tl
          ? mm(e, n) && (M = 'onCompositionEnd')
          : e === 'keydown' && n.keyCode === 229 && (M = 'onCompositionStart')
      M &&
        (dm &&
          n.locale !== 'ko' &&
          (Tl || M !== 'onCompositionStart'
            ? M === 'onCompositionEnd' && Tl && (O = sm())
            : ((gn = o), (Af = 'value' in gn ? gn.value : gn.textContent), (Tl = !0))),
        (A = Ai(f, M)),
        0 < A.length &&
          ((M = new Vo(M, e, null, n, o)),
          g.push({ event: M, listeners: A }),
          O ? (M.data = O) : ((O = hm(n)), O !== null && (M.data = O)))),
        (O = y0 ? b0(e, n) : E0(e, n)) &&
          ((M = Ai(f, 'onBeforeInput')),
          0 < M.length &&
            ((A = new Vo('onBeforeInput', 'beforeinput', null, n, o)),
            g.push({ event: A, listeners: M }),
            (A.data = O))),
        sy(g, e, f, n, o)
    }
    tg(g, t)
  })
}
function ea(e, t, n) {
  return { instance: e, listener: t, currentTarget: n }
}
function Ai(e, t) {
  for (var n = t + 'Capture', l = []; e !== null; ) {
    var u = e,
      a = u.stateNode
    ;(u = u.tag),
      (u !== 5 && u !== 26 && u !== 27) ||
        a === null ||
        ((u = ku(e, n)),
        u != null && l.unshift(ea(e, u, a)),
        (u = ku(e, t)),
        u != null && l.push(ea(e, u, a))),
      (e = e.return)
  }
  return l
}
function gl(e) {
  if (e === null) return null
  do e = e.return
  while (e && e.tag !== 5 && e.tag !== 27)
  return e || null
}
function Us(e, t, n, l, u) {
  for (var a = t._reactName, i = []; n !== null && n !== l; ) {
    var r = n,
      c = r.alternate,
      f = r.stateNode
    if (((r = r.tag), c !== null && c === l)) break
    ;(r !== 5 && r !== 26 && r !== 27) ||
      f === null ||
      ((c = f),
      u
        ? ((f = ku(n, a)), f != null && i.unshift(ea(n, f, c)))
        : u || ((f = ku(n, a)), f != null && i.push(ea(n, f, c)))),
      (n = n.return)
  }
  i.length !== 0 && e.push({ event: t, listeners: i })
}
var gy = /\r\n?/g,
  vy = /\u0000|\uFFFD/g
function js(e) {
  return (typeof e == 'string' ? e : '' + e)
    .replace(
      gy,
      `
`
    )
    .replace(vy, '')
}
function lg(e, t) {
  return (t = js(t)), js(e) === t
}
function er() {}
function J(e, t, n, l, u, a) {
  switch (n) {
    case 'children':
      typeof l == 'string'
        ? t === 'body' || (t === 'textarea' && l === '') || Xl(e, l)
        : (typeof l == 'number' || typeof l == 'bigint') && t !== 'body' && Xl(e, '' + l)
      break
    case 'className':
      Na(e, 'class', l)
      break
    case 'tabIndex':
      Na(e, 'tabindex', l)
      break
    case 'dir':
    case 'role':
    case 'viewBox':
    case 'width':
    case 'height':
      Na(e, n, l)
      break
    case 'style':
      fm(e, l, a)
      break
    case 'data':
      if (t !== 'object') {
        Na(e, 'data', l)
        break
      }
    case 'src':
    case 'href':
      if (l === '' && (t !== 'a' || n !== 'href')) {
        e.removeAttribute(n)
        break
      }
      if (l == null || typeof l == 'function' || typeof l == 'symbol' || typeof l == 'boolean') {
        e.removeAttribute(n)
        break
      }
      ;(l = ka('' + l)), e.setAttribute(n, l)
      break
    case 'action':
    case 'formAction':
      if (typeof l == 'function') {
        e.setAttribute(
          n,
          "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
        )
        break
      } else
        typeof a == 'function' &&
          (n === 'formAction'
            ? (t !== 'input' && J(e, t, 'name', u.name, u, null),
              J(e, t, 'formEncType', u.formEncType, u, null),
              J(e, t, 'formMethod', u.formMethod, u, null),
              J(e, t, 'formTarget', u.formTarget, u, null))
            : (J(e, t, 'encType', u.encType, u, null),
              J(e, t, 'method', u.method, u, null),
              J(e, t, 'target', u.target, u, null)))
      if (l == null || typeof l == 'symbol' || typeof l == 'boolean') {
        e.removeAttribute(n)
        break
      }
      ;(l = ka('' + l)), e.setAttribute(n, l)
      break
    case 'onClick':
      l != null && (e.onclick = er)
      break
    case 'onScroll':
      l != null && Q('scroll', e)
      break
    case 'onScrollEnd':
      l != null && Q('scrollend', e)
      break
    case 'dangerouslySetInnerHTML':
      if (l != null) {
        if (typeof l != 'object' || !('__html' in l)) throw Error(T(61))
        if (((n = l.__html), n != null)) {
          if (u.children != null) throw Error(T(60))
          e.innerHTML = n
        }
      }
      break
    case 'multiple':
      e.multiple = l && typeof l != 'function' && typeof l != 'symbol'
      break
    case 'muted':
      e.muted = l && typeof l != 'function' && typeof l != 'symbol'
      break
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
    case 'defaultValue':
    case 'defaultChecked':
    case 'innerHTML':
    case 'ref':
      break
    case 'autoFocus':
      break
    case 'xlinkHref':
      if (l == null || typeof l == 'function' || typeof l == 'boolean' || typeof l == 'symbol') {
        e.removeAttribute('xlink:href')
        break
      }
      ;(n = ka('' + l)), e.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', n)
      break
    case 'contentEditable':
    case 'spellCheck':
    case 'draggable':
    case 'value':
    case 'autoReverse':
    case 'externalResourcesRequired':
    case 'focusable':
    case 'preserveAlpha':
      l != null && typeof l != 'function' && typeof l != 'symbol'
        ? e.setAttribute(n, '' + l)
        : e.removeAttribute(n)
      break
    case 'inert':
    case 'allowFullScreen':
    case 'async':
    case 'autoPlay':
    case 'controls':
    case 'default':
    case 'defer':
    case 'disabled':
    case 'disablePictureInPicture':
    case 'disableRemotePlayback':
    case 'formNoValidate':
    case 'hidden':
    case 'loop':
    case 'noModule':
    case 'noValidate':
    case 'open':
    case 'playsInline':
    case 'readOnly':
    case 'required':
    case 'reversed':
    case 'scoped':
    case 'seamless':
    case 'itemScope':
      l && typeof l != 'function' && typeof l != 'symbol'
        ? e.setAttribute(n, '')
        : e.removeAttribute(n)
      break
    case 'capture':
    case 'download':
      l === !0
        ? e.setAttribute(n, '')
        : l !== !1 && l != null && typeof l != 'function' && typeof l != 'symbol'
        ? e.setAttribute(n, l)
        : e.removeAttribute(n)
      break
    case 'cols':
    case 'rows':
    case 'size':
    case 'span':
      l != null && typeof l != 'function' && typeof l != 'symbol' && !isNaN(l) && 1 <= l
        ? e.setAttribute(n, l)
        : e.removeAttribute(n)
      break
    case 'rowSpan':
    case 'start':
      l == null || typeof l == 'function' || typeof l == 'symbol' || isNaN(l)
        ? e.removeAttribute(n)
        : e.setAttribute(n, l)
      break
    case 'popover':
      Q('beforetoggle', e), Q('toggle', e), Za(e, 'popover', l)
      break
    case 'xlinkActuate':
      Lt(e, 'http://www.w3.org/1999/xlink', 'xlink:actuate', l)
      break
    case 'xlinkArcrole':
      Lt(e, 'http://www.w3.org/1999/xlink', 'xlink:arcrole', l)
      break
    case 'xlinkRole':
      Lt(e, 'http://www.w3.org/1999/xlink', 'xlink:role', l)
      break
    case 'xlinkShow':
      Lt(e, 'http://www.w3.org/1999/xlink', 'xlink:show', l)
      break
    case 'xlinkTitle':
      Lt(e, 'http://www.w3.org/1999/xlink', 'xlink:title', l)
      break
    case 'xlinkType':
      Lt(e, 'http://www.w3.org/1999/xlink', 'xlink:type', l)
      break
    case 'xmlBase':
      Lt(e, 'http://www.w3.org/XML/1998/namespace', 'xml:base', l)
      break
    case 'xmlLang':
      Lt(e, 'http://www.w3.org/XML/1998/namespace', 'xml:lang', l)
      break
    case 'xmlSpace':
      Lt(e, 'http://www.w3.org/XML/1998/namespace', 'xml:space', l)
      break
    case 'is':
      Za(e, 'is', l)
      break
    case 'innerText':
    case 'textContent':
      break
    default:
      ;(!(2 < n.length) || (n[0] !== 'o' && n[0] !== 'O') || (n[1] !== 'n' && n[1] !== 'N')) &&
        ((n = Vp.get(n) || n), Za(e, n, l))
  }
}
function Fc(e, t, n, l, u, a) {
  switch (n) {
    case 'style':
      fm(e, l, a)
      break
    case 'dangerouslySetInnerHTML':
      if (l != null) {
        if (typeof l != 'object' || !('__html' in l)) throw Error(T(61))
        if (((n = l.__html), n != null)) {
          if (u.children != null) throw Error(T(60))
          e.innerHTML = n
        }
      }
      break
    case 'children':
      typeof l == 'string'
        ? Xl(e, l)
        : (typeof l == 'number' || typeof l == 'bigint') && Xl(e, '' + l)
      break
    case 'onScroll':
      l != null && Q('scroll', e)
      break
    case 'onScrollEnd':
      l != null && Q('scrollend', e)
      break
    case 'onClick':
      l != null && (e.onclick = er)
      break
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
    case 'innerHTML':
    case 'ref':
      break
    case 'innerText':
    case 'textContent':
      break
    default:
      if (!lm.hasOwnProperty(n))
        e: {
          if (
            n[0] === 'o' &&
            n[1] === 'n' &&
            ((u = n.endsWith('Capture')),
            (t = n.slice(2, u ? n.length - 7 : void 0)),
            (a = e[Fe] || null),
            (a = a != null ? a[n] : null),
            typeof a == 'function' && e.removeEventListener(t, a, u),
            typeof l == 'function')
          ) {
            typeof a != 'function' &&
              a !== null &&
              (n in e ? (e[n] = null) : e.hasAttribute(n) && e.removeAttribute(n)),
              e.addEventListener(t, l, u)
            break e
          }
          n in e ? (e[n] = l) : l === !0 ? e.setAttribute(n, '') : Za(e, n, l)
        }
  }
}
function ze(e, t, n) {
  switch (t) {
    case 'div':
    case 'span':
    case 'svg':
    case 'path':
    case 'a':
    case 'g':
    case 'p':
    case 'li':
      break
    case 'img':
      Q('error', e), Q('load', e)
      var l = !1,
        u = !1,
        a
      for (a in n)
        if (n.hasOwnProperty(a)) {
          var i = n[a]
          if (i != null)
            switch (a) {
              case 'src':
                l = !0
                break
              case 'srcSet':
                u = !0
                break
              case 'children':
              case 'dangerouslySetInnerHTML':
                throw Error(T(137, t))
              default:
                J(e, t, a, i, n, null)
            }
        }
      u && J(e, t, 'srcSet', n.srcSet, n, null), l && J(e, t, 'src', n.src, n, null)
      return
    case 'input':
      Q('invalid', e)
      var r = (a = i = u = null),
        c = null,
        f = null
      for (l in n)
        if (n.hasOwnProperty(l)) {
          var o = n[l]
          if (o != null)
            switch (l) {
              case 'name':
                u = o
                break
              case 'type':
                i = o
                break
              case 'checked':
                c = o
                break
              case 'defaultChecked':
                f = o
                break
              case 'value':
                a = o
                break
              case 'defaultValue':
                r = o
                break
              case 'children':
              case 'dangerouslySetInnerHTML':
                if (o != null) throw Error(T(137, t))
                break
              default:
                J(e, t, l, o, n, null)
            }
        }
      im(e, a, r, c, f, i, u, !1), fi(e)
      return
    case 'select':
      Q('invalid', e), (l = i = a = null)
      for (u in n)
        if (n.hasOwnProperty(u) && ((r = n[u]), r != null))
          switch (u) {
            case 'value':
              a = r
              break
            case 'defaultValue':
              i = r
              break
            case 'multiple':
              l = r
            default:
              J(e, t, u, r, n, null)
          }
      ;(t = a),
        (n = i),
        (e.multiple = !!l),
        t != null ? Nl(e, !!l, t, !1) : n != null && Nl(e, !!l, n, !0)
      return
    case 'textarea':
      Q('invalid', e), (a = u = l = null)
      for (i in n)
        if (n.hasOwnProperty(i) && ((r = n[i]), r != null))
          switch (i) {
            case 'value':
              l = r
              break
            case 'defaultValue':
              u = r
              break
            case 'children':
              a = r
              break
            case 'dangerouslySetInnerHTML':
              if (r != null) throw Error(T(91))
              break
            default:
              J(e, t, i, r, n, null)
          }
      cm(e, l, u, a), fi(e)
      return
    case 'option':
      for (c in n)
        if (n.hasOwnProperty(c) && ((l = n[c]), l != null))
          switch (c) {
            case 'selected':
              e.selected = l && typeof l != 'function' && typeof l != 'symbol'
              break
            default:
              J(e, t, c, l, n, null)
          }
      return
    case 'dialog':
      Q('cancel', e), Q('close', e)
      break
    case 'iframe':
    case 'object':
      Q('load', e)
      break
    case 'video':
    case 'audio':
      for (l = 0; l < Iu.length; l++) Q(Iu[l], e)
      break
    case 'image':
      Q('error', e), Q('load', e)
      break
    case 'details':
      Q('toggle', e)
      break
    case 'embed':
    case 'source':
    case 'link':
      Q('error', e), Q('load', e)
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'hr':
    case 'keygen':
    case 'meta':
    case 'param':
    case 'track':
    case 'wbr':
    case 'menuitem':
      for (f in n)
        if (n.hasOwnProperty(f) && ((l = n[f]), l != null))
          switch (f) {
            case 'children':
            case 'dangerouslySetInnerHTML':
              throw Error(T(137, t))
            default:
              J(e, t, f, l, n, null)
          }
      return
    default:
      if (Of(t)) {
        for (o in n) n.hasOwnProperty(o) && ((l = n[o]), l !== void 0 && Fc(e, t, o, l, n, void 0))
        return
      }
  }
  for (r in n) n.hasOwnProperty(r) && ((l = n[r]), l != null && J(e, t, r, l, n, null))
}
function py(e, t, n, l) {
  switch (t) {
    case 'div':
    case 'span':
    case 'svg':
    case 'path':
    case 'a':
    case 'g':
    case 'p':
    case 'li':
      break
    case 'input':
      var u = null,
        a = null,
        i = null,
        r = null,
        c = null,
        f = null,
        o = null
      for (s in n) {
        var g = n[s]
        if (n.hasOwnProperty(s) && g != null)
          switch (s) {
            case 'checked':
              break
            case 'value':
              break
            case 'defaultValue':
              c = g
            default:
              l.hasOwnProperty(s) || J(e, t, s, null, l, g)
          }
      }
      for (var m in l) {
        var s = l[m]
        if (((g = n[m]), l.hasOwnProperty(m) && (s != null || g != null)))
          switch (m) {
            case 'type':
              a = s
              break
            case 'name':
              u = s
              break
            case 'checked':
              f = s
              break
            case 'defaultChecked':
              o = s
              break
            case 'value':
              i = s
              break
            case 'defaultValue':
              r = s
              break
            case 'children':
            case 'dangerouslySetInnerHTML':
              if (s != null) throw Error(T(137, t))
              break
            default:
              s !== g && J(e, t, m, s, l, g)
          }
      }
      pc(e, i, r, c, f, o, a, u)
      return
    case 'select':
      s = i = r = m = null
      for (a in n)
        if (((c = n[a]), n.hasOwnProperty(a) && c != null))
          switch (a) {
            case 'value':
              break
            case 'multiple':
              s = c
            default:
              l.hasOwnProperty(a) || J(e, t, a, null, l, c)
          }
      for (u in l)
        if (((a = l[u]), (c = n[u]), l.hasOwnProperty(u) && (a != null || c != null)))
          switch (u) {
            case 'value':
              m = a
              break
            case 'defaultValue':
              r = a
              break
            case 'multiple':
              i = a
            default:
              a !== c && J(e, t, u, a, l, c)
          }
      ;(t = r),
        (n = i),
        (l = s),
        m != null
          ? Nl(e, !!n, m, !1)
          : !!l != !!n && (t != null ? Nl(e, !!n, t, !0) : Nl(e, !!n, n ? [] : '', !1))
      return
    case 'textarea':
      s = m = null
      for (r in n)
        if (((u = n[r]), n.hasOwnProperty(r) && u != null && !l.hasOwnProperty(r)))
          switch (r) {
            case 'value':
              break
            case 'children':
              break
            default:
              J(e, t, r, null, l, u)
          }
      for (i in l)
        if (((u = l[i]), (a = n[i]), l.hasOwnProperty(i) && (u != null || a != null)))
          switch (i) {
            case 'value':
              m = u
              break
            case 'defaultValue':
              s = u
              break
            case 'children':
              break
            case 'dangerouslySetInnerHTML':
              if (u != null) throw Error(T(91))
              break
            default:
              u !== a && J(e, t, i, u, l, a)
          }
      rm(e, m, s)
      return
    case 'option':
      for (var y in n)
        if (((m = n[y]), n.hasOwnProperty(y) && m != null && !l.hasOwnProperty(y)))
          switch (y) {
            case 'selected':
              e.selected = !1
              break
            default:
              J(e, t, y, null, l, m)
          }
      for (c in l)
        if (((m = l[c]), (s = n[c]), l.hasOwnProperty(c) && m !== s && (m != null || s != null)))
          switch (c) {
            case 'selected':
              e.selected = m && typeof m != 'function' && typeof m != 'symbol'
              break
            default:
              J(e, t, c, m, l, s)
          }
      return
    case 'img':
    case 'link':
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'embed':
    case 'hr':
    case 'keygen':
    case 'meta':
    case 'param':
    case 'source':
    case 'track':
    case 'wbr':
    case 'menuitem':
      for (var E in n)
        (m = n[E]),
          n.hasOwnProperty(E) && m != null && !l.hasOwnProperty(E) && J(e, t, E, null, l, m)
      for (f in l)
        if (((m = l[f]), (s = n[f]), l.hasOwnProperty(f) && m !== s && (m != null || s != null)))
          switch (f) {
            case 'children':
            case 'dangerouslySetInnerHTML':
              if (m != null) throw Error(T(137, t))
              break
            default:
              J(e, t, f, m, l, s)
          }
      return
    default:
      if (Of(t)) {
        for (var x in n)
          (m = n[x]),
            n.hasOwnProperty(x) && m !== void 0 && !l.hasOwnProperty(x) && Fc(e, t, x, void 0, l, m)
        for (o in l)
          (m = l[o]),
            (s = n[o]),
            !l.hasOwnProperty(o) ||
              m === s ||
              (m === void 0 && s === void 0) ||
              Fc(e, t, o, m, l, s)
        return
      }
  }
  for (var v in n)
    (m = n[v]), n.hasOwnProperty(v) && m != null && !l.hasOwnProperty(v) && J(e, t, v, null, l, m)
  for (g in l)
    (m = l[g]),
      (s = n[g]),
      !l.hasOwnProperty(g) || m === s || (m == null && s == null) || J(e, t, g, m, l, s)
}
var Kc = null,
  Jc = null
function Ri(e) {
  return e.nodeType === 9 ? e : e.ownerDocument
}
function qs(e) {
  switch (e) {
    case 'http://www.w3.org/2000/svg':
      return 1
    case 'http://www.w3.org/1998/Math/MathML':
      return 2
    default:
      return 0
  }
}
function ug(e, t) {
  if (e === 0)
    switch (t) {
      case 'svg':
        return 1
      case 'math':
        return 2
      default:
        return 0
    }
  return e === 1 && t === 'foreignObject' ? 0 : e
}
function Wc(e, t) {
  return (
    e === 'textarea' ||
    e === 'noscript' ||
    typeof t.children == 'string' ||
    typeof t.children == 'number' ||
    typeof t.children == 'bigint' ||
    (typeof t.dangerouslySetInnerHTML == 'object' &&
      t.dangerouslySetInnerHTML !== null &&
      t.dangerouslySetInnerHTML.__html != null)
  )
}
var Jr = null
function yy() {
  var e = window.event
  return e && e.type === 'popstate' ? (e === Jr ? !1 : ((Jr = e), !0)) : ((Jr = null), !1)
}
var ag = typeof setTimeout == 'function' ? setTimeout : void 0,
  by = typeof clearTimeout == 'function' ? clearTimeout : void 0,
  Bs = typeof Promise == 'function' ? Promise : void 0,
  Ey =
    typeof queueMicrotask == 'function'
      ? queueMicrotask
      : typeof Bs < 'u'
      ? function (e) {
          return Bs.resolve(null).then(e).catch(Sy)
        }
      : ag
function Sy(e) {
  setTimeout(function () {
    throw e
  })
}
function Wr(e, t) {
  var n = t,
    l = 0
  do {
    var u = n.nextSibling
    if ((e.removeChild(n), u && u.nodeType === 8))
      if (((n = u.data), n === '/$')) {
        if (l === 0) {
          e.removeChild(u), aa(t)
          return
        }
        l--
      } else (n !== '$' && n !== '$?' && n !== '$!') || l++
    n = u
  } while (n)
  aa(t)
}
function Pc(e) {
  var t = e.firstChild
  for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
    var n = t
    switch (((t = t.nextSibling), n.nodeName)) {
      case 'HTML':
      case 'HEAD':
      case 'BODY':
        Pc(n), Tf(n)
        continue
      case 'SCRIPT':
      case 'STYLE':
        continue
      case 'LINK':
        if (n.rel.toLowerCase() === 'stylesheet') continue
    }
    e.removeChild(n)
  }
}
function xy(e, t, n, l) {
  for (; e.nodeType === 1; ) {
    var u = n
    if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
      if (!l && (e.nodeName !== 'INPUT' || e.type !== 'hidden')) break
    } else if (l) {
      if (!e[Zu])
        switch (t) {
          case 'meta':
            if (!e.hasAttribute('itemprop')) break
            return e
          case 'link':
            if (
              ((a = e.getAttribute('rel')), a === 'stylesheet' && e.hasAttribute('data-precedence'))
            )
              break
            if (
              a !== u.rel ||
              e.getAttribute('href') !== (u.href == null ? null : u.href) ||
              e.getAttribute('crossorigin') !== (u.crossOrigin == null ? null : u.crossOrigin) ||
              e.getAttribute('title') !== (u.title == null ? null : u.title)
            )
              break
            return e
          case 'style':
            if (e.hasAttribute('data-precedence')) break
            return e
          case 'script':
            if (
              ((a = e.getAttribute('src')),
              (a !== (u.src == null ? null : u.src) ||
                e.getAttribute('type') !== (u.type == null ? null : u.type) ||
                e.getAttribute('crossorigin') !== (u.crossOrigin == null ? null : u.crossOrigin)) &&
                a &&
                e.hasAttribute('async') &&
                !e.hasAttribute('itemprop'))
            )
              break
            return e
          default:
            return e
        }
    } else if (t === 'input' && e.type === 'hidden') {
      var a = u.name == null ? null : '' + u.name
      if (u.type === 'hidden' && e.getAttribute('name') === a) return e
    } else return e
    if (((e = Et(e.nextSibling)), e === null)) break
  }
  return null
}
function Ty(e, t, n) {
  if (t === '') return null
  for (; e.nodeType !== 3; )
    if (
      ((e.nodeType !== 1 || e.nodeName !== 'INPUT' || e.type !== 'hidden') && !n) ||
      ((e = Et(e.nextSibling)), e === null)
    )
      return null
  return e
}
function Et(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType
    if (t === 1 || t === 3) break
    if (t === 8) {
      if (((t = e.data), t === '$' || t === '$!' || t === '$?' || t === 'F!' || t === 'F')) break
      if (t === '/$') return null
    }
  }
  return e
}
function $s(e) {
  e = e.previousSibling
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data
      if (n === '$' || n === '$!' || n === '$?') {
        if (t === 0) return e
        t--
      } else n === '/$' && t++
    }
    e = e.previousSibling
  }
  return null
}
function ig(e, t, n) {
  switch (((t = Ri(n)), e)) {
    case 'html':
      if (((e = t.documentElement), !e)) throw Error(T(452))
      return e
    case 'head':
      if (((e = t.head), !e)) throw Error(T(453))
      return e
    case 'body':
      if (((e = t.body), !e)) throw Error(T(454))
      return e
    default:
      throw Error(T(451))
  }
}
var vt = new Map(),
  Ys = new Set()
function Mi(e) {
  return typeof e.getRootNode == 'function' ? e.getRootNode() : e.ownerDocument
}
var It = ne.d
ne.d = { f: Oy, r: wy, D: Ay, C: Ry, L: My, m: Dy, X: Cy, S: _y, M: Ny }
function Oy() {
  var e = It.f(),
    t = Pi()
  return e || t
}
function wy(e) {
  var t = nu(e)
  t !== null && t.tag === 5 && t.type === 'form' ? ih(t) : It.r(e)
}
var uu = typeof document > 'u' ? null : document
function rg(e, t, n) {
  var l = uu
  if (l && typeof t == 'string' && t) {
    var u = st(t)
    ;(u = 'link[rel="' + e + '"][href="' + u + '"]'),
      typeof n == 'string' && (u += '[crossorigin="' + n + '"]'),
      Ys.has(u) ||
        (Ys.add(u),
        (e = { rel: e, crossOrigin: n, href: t }),
        l.querySelector(u) === null &&
          ((t = l.createElement('link')), ze(t, 'link', e), Re(t), l.head.appendChild(t)))
  }
}
function Ay(e) {
  It.D(e), rg('dns-prefetch', e, null)
}
function Ry(e, t) {
  It.C(e, t), rg('preconnect', e, t)
}
function My(e, t, n) {
  It.L(e, t, n)
  var l = uu
  if (l && e && t) {
    var u = 'link[rel="preload"][as="' + st(t) + '"]'
    t === 'image' && n && n.imageSrcSet
      ? ((u += '[imagesrcset="' + st(n.imageSrcSet) + '"]'),
        typeof n.imageSizes == 'string' && (u += '[imagesizes="' + st(n.imageSizes) + '"]'))
      : (u += '[href="' + st(e) + '"]')
    var a = u
    switch (t) {
      case 'style':
        a = Kl(e)
        break
      case 'script':
        a = au(e)
    }
    vt.has(a) ||
      ((e = ue(
        { rel: 'preload', href: t === 'image' && n && n.imageSrcSet ? void 0 : e, as: t },
        n
      )),
      vt.set(a, e),
      l.querySelector(u) !== null ||
        (t === 'style' && l.querySelector(ba(a))) ||
        (t === 'script' && l.querySelector(Ea(a))) ||
        ((t = l.createElement('link')), ze(t, 'link', e), Re(t), l.head.appendChild(t)))
  }
}
function Dy(e, t) {
  It.m(e, t)
  var n = uu
  if (n && e) {
    var l = t && typeof t.as == 'string' ? t.as : 'script',
      u = 'link[rel="modulepreload"][as="' + st(l) + '"][href="' + st(e) + '"]',
      a = u
    switch (l) {
      case 'audioworklet':
      case 'paintworklet':
      case 'serviceworker':
      case 'sharedworker':
      case 'worker':
      case 'script':
        a = au(e)
    }
    if (
      !vt.has(a) &&
      ((e = ue({ rel: 'modulepreload', href: e }, t)), vt.set(a, e), n.querySelector(u) === null)
    ) {
      switch (l) {
        case 'audioworklet':
        case 'paintworklet':
        case 'serviceworker':
        case 'sharedworker':
        case 'worker':
        case 'script':
          if (n.querySelector(Ea(a))) return
      }
      ;(l = n.createElement('link')), ze(l, 'link', e), Re(l), n.head.appendChild(l)
    }
  }
}
function _y(e, t, n) {
  It.S(e, t, n)
  var l = uu
  if (l && e) {
    var u = Cl(l).hoistableStyles,
      a = Kl(e)
    t = t || 'default'
    var i = u.get(a)
    if (!i) {
      var r = { loading: 0, preload: null }
      if ((i = l.querySelector(ba(a)))) r.loading = 5
      else {
        ;(e = ue({ 'rel': 'stylesheet', 'href': e, 'data-precedence': t }, n)),
          (n = vt.get(a)) && io(e, n)
        var c = (i = l.createElement('link'))
        Re(c),
          ze(c, 'link', e),
          (c._p = new Promise(function (f, o) {
            ;(c.onload = f), (c.onerror = o)
          })),
          c.addEventListener('load', function () {
            r.loading |= 1
          }),
          c.addEventListener('error', function () {
            r.loading |= 2
          }),
          (r.loading |= 4),
          ti(i, t, l)
      }
      ;(i = { type: 'stylesheet', instance: i, count: 1, state: r }), u.set(a, i)
    }
  }
}
function Cy(e, t) {
  It.X(e, t)
  var n = uu
  if (n && e) {
    var l = Cl(n).hoistableScripts,
      u = au(e),
      a = l.get(u)
    a ||
      ((a = n.querySelector(Ea(u))),
      a ||
        ((e = ue({ src: e, async: !0 }, t)),
        (t = vt.get(u)) && ro(e, t),
        (a = n.createElement('script')),
        Re(a),
        ze(a, 'link', e),
        n.head.appendChild(a)),
      (a = { type: 'script', instance: a, count: 1, state: null }),
      l.set(u, a))
  }
}
function Ny(e, t) {
  It.M(e, t)
  var n = uu
  if (n && e) {
    var l = Cl(n).hoistableScripts,
      u = au(e),
      a = l.get(u)
    a ||
      ((a = n.querySelector(Ea(u))),
      a ||
        ((e = ue({ src: e, async: !0, type: 'module' }, t)),
        (t = vt.get(u)) && ro(e, t),
        (a = n.createElement('script')),
        Re(a),
        ze(a, 'link', e),
        n.head.appendChild(a)),
      (a = { type: 'script', instance: a, count: 1, state: null }),
      l.set(u, a))
  }
}
function Gs(e, t, n, l) {
  var u = (u = pn.current) ? Mi(u) : null
  if (!u) throw Error(T(446))
  switch (e) {
    case 'meta':
    case 'title':
      return null
    case 'style':
      return typeof n.precedence == 'string' && typeof n.href == 'string'
        ? ((t = Kl(n.href)),
          (n = Cl(u).hoistableStyles),
          (l = n.get(t)),
          l || ((l = { type: 'style', instance: null, count: 0, state: null }), n.set(t, l)),
          l)
        : { type: 'void', instance: null, count: 0, state: null }
    case 'link':
      if (n.rel === 'stylesheet' && typeof n.href == 'string' && typeof n.precedence == 'string') {
        e = Kl(n.href)
        var a = Cl(u).hoistableStyles,
          i = a.get(e)
        if (
          (i ||
            ((u = u.ownerDocument || u),
            (i = {
              type: 'stylesheet',
              instance: null,
              count: 0,
              state: { loading: 0, preload: null }
            }),
            a.set(e, i),
            (a = u.querySelector(ba(e))) && !a._p && ((i.instance = a), (i.state.loading = 5)),
            vt.has(e) ||
              ((n = {
                rel: 'preload',
                as: 'style',
                href: n.href,
                crossOrigin: n.crossOrigin,
                integrity: n.integrity,
                media: n.media,
                hrefLang: n.hrefLang,
                referrerPolicy: n.referrerPolicy
              }),
              vt.set(e, n),
              a || zy(u, e, n, i.state))),
          t && l === null)
        )
          throw Error(T(528, ''))
        return i
      }
      if (t && l !== null) throw Error(T(529, ''))
      return null
    case 'script':
      return (
        (t = n.async),
        (n = n.src),
        typeof n == 'string' && t && typeof t != 'function' && typeof t != 'symbol'
          ? ((t = au(n)),
            (n = Cl(u).hoistableScripts),
            (l = n.get(t)),
            l || ((l = { type: 'script', instance: null, count: 0, state: null }), n.set(t, l)),
            l)
          : { type: 'void', instance: null, count: 0, state: null }
      )
    default:
      throw Error(T(444, e))
  }
}
function Kl(e) {
  return 'href="' + st(e) + '"'
}
function ba(e) {
  return 'link[rel="stylesheet"][' + e + ']'
}
function cg(e) {
  return ue({}, e, { 'data-precedence': e.precedence, 'precedence': null })
}
function zy(e, t, n, l) {
  e.querySelector('link[rel="preload"][as="style"][' + t + ']')
    ? (l.loading = 1)
    : ((t = e.createElement('link')),
      (l.preload = t),
      t.addEventListener('load', function () {
        return (l.loading |= 1)
      }),
      t.addEventListener('error', function () {
        return (l.loading |= 2)
      }),
      ze(t, 'link', n),
      Re(t),
      e.head.appendChild(t))
}
function au(e) {
  return '[src="' + st(e) + '"]'
}
function Ea(e) {
  return 'script[async]' + e
}
function Xs(e, t, n) {
  if ((t.count++, t.instance === null))
    switch (t.type) {
      case 'style':
        var l = e.querySelector('style[data-href~="' + st(n.href) + '"]')
        if (l) return (t.instance = l), Re(l), l
        var u = ue({}, n, {
          'data-href': n.href,
          'data-precedence': n.precedence,
          'href': null,
          'precedence': null
        })
        return (
          (l = (e.ownerDocument || e).createElement('style')),
          Re(l),
          ze(l, 'style', u),
          ti(l, n.precedence, e),
          (t.instance = l)
        )
      case 'stylesheet':
        u = Kl(n.href)
        var a = e.querySelector(ba(u))
        if (a) return (t.state.loading |= 4), (t.instance = a), Re(a), a
        ;(l = cg(n)),
          (u = vt.get(u)) && io(l, u),
          (a = (e.ownerDocument || e).createElement('link')),
          Re(a)
        var i = a
        return (
          (i._p = new Promise(function (r, c) {
            ;(i.onload = r), (i.onerror = c)
          })),
          ze(a, 'link', l),
          (t.state.loading |= 4),
          ti(a, n.precedence, e),
          (t.instance = a)
        )
      case 'script':
        return (
          (a = au(n.src)),
          (u = e.querySelector(Ea(a)))
            ? ((t.instance = u), Re(u), u)
            : ((l = n),
              (u = vt.get(a)) && ((l = ue({}, n)), ro(l, u)),
              (e = e.ownerDocument || e),
              (u = e.createElement('script')),
              Re(u),
              ze(u, 'link', l),
              e.head.appendChild(u),
              (t.instance = u))
        )
      case 'void':
        return null
      default:
        throw Error(T(443, t.type))
    }
  else
    t.type === 'stylesheet' &&
      !(t.state.loading & 4) &&
      ((l = t.instance), (t.state.loading |= 4), ti(l, n.precedence, e))
  return t.instance
}
function ti(e, t, n) {
  for (
    var l = n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),
      u = l.length ? l[l.length - 1] : null,
      a = u,
      i = 0;
    i < l.length;
    i++
  ) {
    var r = l[i]
    if (r.dataset.precedence === t) a = r
    else if (a !== u) break
  }
  a
    ? a.parentNode.insertBefore(e, a.nextSibling)
    : ((t = n.nodeType === 9 ? n.head : n), t.insertBefore(e, t.firstChild))
}
function io(e, t) {
  e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
    e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
    e.title == null && (e.title = t.title)
}
function ro(e, t) {
  e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
    e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
    e.integrity == null && (e.integrity = t.integrity)
}
var ni = null
function Qs(e, t, n) {
  if (ni === null) {
    var l = new Map(),
      u = (ni = new Map())
    u.set(n, l)
  } else (u = ni), (l = u.get(n)), l || ((l = new Map()), u.set(n, l))
  if (l.has(e)) return l
  for (l.set(e, null), n = n.getElementsByTagName(e), u = 0; u < n.length; u++) {
    var a = n[u]
    if (
      !(a[Zu] || a[je] || (e === 'link' && a.getAttribute('rel') === 'stylesheet')) &&
      a.namespaceURI !== 'http://www.w3.org/2000/svg'
    ) {
      var i = a.getAttribute(t) || ''
      i = e + i
      var r = l.get(i)
      r ? r.push(a) : l.set(i, [a])
    }
  }
  return l
}
function Vs(e, t, n) {
  ;(e = e.ownerDocument || e),
    e.head.insertBefore(n, t === 'title' ? e.querySelector('head > title') : null)
}
function Hy(e, t, n) {
  if (n === 1 || t.itemProp != null) return !1
  switch (e) {
    case 'meta':
    case 'title':
      return !0
    case 'style':
      if (typeof t.precedence != 'string' || typeof t.href != 'string' || t.href === '') break
      return !0
    case 'link':
      if (
        typeof t.rel != 'string' ||
        typeof t.href != 'string' ||
        t.href === '' ||
        t.onLoad ||
        t.onError
      )
        break
      switch (t.rel) {
        case 'stylesheet':
          return (e = t.disabled), typeof t.precedence == 'string' && e == null
        default:
          return !0
      }
    case 'script':
      if (
        t.async &&
        typeof t.async != 'function' &&
        typeof t.async != 'symbol' &&
        !t.onLoad &&
        !t.onError &&
        t.src &&
        typeof t.src == 'string'
      )
        return !0
  }
  return !1
}
function fg(e) {
  return !(e.type === 'stylesheet' && !(e.state.loading & 3))
}
var ta = null
function Ly() {}
function Uy(e, t, n) {
  if (ta === null) throw Error(T(475))
  var l = ta
  if (
    t.type === 'stylesheet' &&
    (typeof n.media != 'string' || matchMedia(n.media).matches !== !1) &&
    !(t.state.loading & 4)
  ) {
    if (t.instance === null) {
      var u = Kl(n.href),
        a = e.querySelector(ba(u))
      if (a) {
        ;(e = a._p),
          e !== null &&
            typeof e == 'object' &&
            typeof e.then == 'function' &&
            (l.count++, (l = Di.bind(l)), e.then(l, l)),
          (t.state.loading |= 4),
          (t.instance = a),
          Re(a)
        return
      }
      ;(a = e.ownerDocument || e),
        (n = cg(n)),
        (u = vt.get(u)) && io(n, u),
        (a = a.createElement('link')),
        Re(a)
      var i = a
      ;(i._p = new Promise(function (r, c) {
        ;(i.onload = r), (i.onerror = c)
      })),
        ze(a, 'link', n),
        (t.instance = a)
    }
    l.stylesheets === null && (l.stylesheets = new Map()),
      l.stylesheets.set(t, e),
      (e = t.state.preload) &&
        !(t.state.loading & 3) &&
        (l.count++, (t = Di.bind(l)), e.addEventListener('load', t), e.addEventListener('error', t))
  }
}
function jy() {
  if (ta === null) throw Error(T(475))
  var e = ta
  return (
    e.stylesheets && e.count === 0 && Ic(e, e.stylesheets),
    0 < e.count
      ? function (t) {
          var n = setTimeout(function () {
            if ((e.stylesheets && Ic(e, e.stylesheets), e.unsuspend)) {
              var l = e.unsuspend
              ;(e.unsuspend = null), l()
            }
          }, 6e4)
          return (
            (e.unsuspend = t),
            function () {
              ;(e.unsuspend = null), clearTimeout(n)
            }
          )
        }
      : null
  )
}
function Di() {
  if ((this.count--, this.count === 0)) {
    if (this.stylesheets) Ic(this, this.stylesheets)
    else if (this.unsuspend) {
      var e = this.unsuspend
      ;(this.unsuspend = null), e()
    }
  }
}
var _i = null
function Ic(e, t) {
  ;(e.stylesheets = null),
    e.unsuspend !== null && (e.count++, (_i = new Map()), t.forEach(qy, e), (_i = null), Di.call(e))
}
function qy(e, t) {
  if (!(t.state.loading & 4)) {
    var n = _i.get(e)
    if (n) var l = n.get(null)
    else {
      ;(n = new Map()), _i.set(e, n)
      for (
        var u = e.querySelectorAll('link[data-precedence],style[data-precedence]'), a = 0;
        a < u.length;
        a++
      ) {
        var i = u[a]
        ;(i.nodeName === 'LINK' || i.getAttribute('media') !== 'not all') &&
          (n.set(i.dataset.precedence, i), (l = i))
      }
      l && n.set(null, l)
    }
    ;(u = t.instance),
      (i = u.getAttribute('data-precedence')),
      (a = n.get(i) || l),
      a === l && n.set(null, u),
      n.set(i, u),
      this.count++,
      (l = Di.bind(this)),
      u.addEventListener('load', l),
      u.addEventListener('error', l),
      a
        ? a.parentNode.insertBefore(u, a.nextSibling)
        : ((e = e.nodeType === 9 ? e.head : e), e.insertBefore(u, e.firstChild)),
      (t.state.loading |= 4)
  }
}
var na = {
  $$typeof: Gt,
  Provider: null,
  Consumer: null,
  _currentValue: Vn,
  _currentValue2: Vn,
  _threadCount: 0
}
function By(e, t, n, l, u, a, i, r) {
  ;(this.tag = 1),
    (this.containerInfo = e),
    (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
    (this.timeoutHandle = -1),
    (this.callbackNode =
      this.next =
      this.pendingContext =
      this.context =
      this.cancelPendingCommit =
        null),
    (this.callbackPriority = 0),
    (this.expirationTimes = xr(-1)),
    (this.entangledLanes =
      this.shellSuspendCounter =
      this.errorRecoveryDisabledLanes =
      this.finishedLanes =
      this.expiredLanes =
      this.warmLanes =
      this.pingedLanes =
      this.suspendedLanes =
      this.pendingLanes =
        0),
    (this.entanglements = xr(0)),
    (this.hiddenUpdates = xr(null)),
    (this.identifierPrefix = l),
    (this.onUncaughtError = u),
    (this.onCaughtError = a),
    (this.onRecoverableError = i),
    (this.pooledCache = null),
    (this.pooledCacheLanes = 0),
    (this.formState = r),
    (this.incompleteTransitions = new Map())
}
function og(e, t, n, l, u, a, i, r, c, f, o, g) {
  return (
    (e = new By(e, t, n, i, r, c, f, g)),
    (t = 1),
    a === !0 && (t |= 24),
    (a = mt(3, null, null, t)),
    (e.current = a),
    (a.stateNode = e),
    (t = Lf()),
    t.refCount++,
    (e.pooledCache = t),
    t.refCount++,
    (a.memoizedState = { element: l, isDehydrated: n, cache: t }),
    Jf(a),
    e
  )
}
function sg(e) {
  return e ? ((e = Rl), e) : Rl
}
function dg(e, t, n, l, u, a) {
  ;(u = sg(u)),
    l.context === null ? (l.context = u) : (l.pendingContext = u),
    (l = yn(t)),
    (l.payload = { element: n }),
    (a = a === void 0 ? null : a),
    a !== null && (l.callback = a),
    (n = bn(e, l, t)),
    n !== null && (Xe(n, e, t), Uu(n, e, t))
}
function Zs(e, t) {
  if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
    var n = e.retryLane
    e.retryLane = n !== 0 && n < t ? n : t
  }
}
function co(e, t) {
  Zs(e, t), (e = e.alternate) && Zs(e, t)
}
function mg(e) {
  if (e.tag === 13) {
    var t = wn(e, 67108864)
    t !== null && Xe(t, e, 67108864), co(e, 67108864)
  }
}
var Ci = !0
function $y(e, t, n, l) {
  var u = B.T
  B.T = null
  var a = ne.p
  try {
    ;(ne.p = 2), fo(e, t, n, l)
  } finally {
    ;(ne.p = a), (B.T = u)
  }
}
function Yy(e, t, n, l) {
  var u = B.T
  B.T = null
  var a = ne.p
  try {
    ;(ne.p = 8), fo(e, t, n, l)
  } finally {
    ;(ne.p = a), (B.T = u)
  }
}
function fo(e, t, n, l) {
  if (Ci) {
    var u = ef(l)
    if (u === null) Kr(e, t, l, Ni, n), ks(e, l)
    else if (Xy(u, e, t, n, l)) l.stopPropagation()
    else if ((ks(e, l), t & 4 && -1 < Gy.indexOf(e))) {
      for (; u !== null; ) {
        var a = nu(u)
        if (a !== null)
          switch (a.tag) {
            case 3:
              if (((a = a.stateNode), a.current.memoizedState.isDehydrated)) {
                var i = jn(a.pendingLanes)
                if (i !== 0) {
                  var r = a
                  for (r.pendingLanes |= 2, r.entangledLanes |= 2; i; ) {
                    var c = 1 << (31 - et(i))
                    ;(r.entanglements[1] |= c), (i &= ~c)
                  }
                  zt(a), !(oe & 6) && ((xi = Rt() + 500), ya(0))
                }
              }
              break
            case 13:
              ;(r = wn(a, 2)), r !== null && Xe(r, a, 2), Pi(), co(a, 2)
          }
        if (((a = ef(l)), a === null && Kr(e, t, l, Ni, n), a === u)) break
        u = a
      }
      u !== null && l.stopPropagation()
    } else Kr(e, t, l, null, n)
  }
}
function ef(e) {
  return (e = wf(e)), oo(e)
}
var Ni = null
function oo(e) {
  if (((Ni = null), (e = Yn(e)), e !== null)) {
    var t = eu(e)
    if (t === null) e = null
    else {
      var n = t.tag
      if (n === 13) {
        if (((e = Vd(t)), e !== null)) return e
        e = null
      } else if (n === 3) {
        if (t.stateNode.current.memoizedState.isDehydrated)
          return t.tag === 3 ? t.stateNode.containerInfo : null
        e = null
      } else t !== e && (e = null)
    }
  }
  return (Ni = e), null
}
function hg(e) {
  switch (e) {
    case 'beforetoggle':
    case 'cancel':
    case 'click':
    case 'close':
    case 'contextmenu':
    case 'copy':
    case 'cut':
    case 'auxclick':
    case 'dblclick':
    case 'dragend':
    case 'dragstart':
    case 'drop':
    case 'focusin':
    case 'focusout':
    case 'input':
    case 'invalid':
    case 'keydown':
    case 'keypress':
    case 'keyup':
    case 'mousedown':
    case 'mouseup':
    case 'paste':
    case 'pause':
    case 'play':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointerup':
    case 'ratechange':
    case 'reset':
    case 'resize':
    case 'seeked':
    case 'submit':
    case 'toggle':
    case 'touchcancel':
    case 'touchend':
    case 'touchstart':
    case 'volumechange':
    case 'change':
    case 'selectionchange':
    case 'textInput':
    case 'compositionstart':
    case 'compositionend':
    case 'compositionupdate':
    case 'beforeblur':
    case 'afterblur':
    case 'beforeinput':
    case 'blur':
    case 'fullscreenchange':
    case 'focus':
    case 'hashchange':
    case 'popstate':
    case 'select':
    case 'selectstart':
      return 2
    case 'drag':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'mousemove':
    case 'mouseout':
    case 'mouseover':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'scroll':
    case 'touchmove':
    case 'wheel':
    case 'mouseenter':
    case 'mouseleave':
    case 'pointerenter':
    case 'pointerleave':
      return 8
    case 'message':
      switch (Rp()) {
        case kd:
          return 2
        case Fd:
          return 8
        case ci:
        case Mp:
          return 32
        case Kd:
          return 268435456
        default:
          return 32
      }
    default:
      return 32
  }
}
var tf = !1,
  xn = null,
  Tn = null,
  On = null,
  la = new Map(),
  ua = new Map(),
  dn = [],
  Gy =
    'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset'.split(
      ' '
    )
function ks(e, t) {
  switch (e) {
    case 'focusin':
    case 'focusout':
      xn = null
      break
    case 'dragenter':
    case 'dragleave':
      Tn = null
      break
    case 'mouseover':
    case 'mouseout':
      On = null
      break
    case 'pointerover':
    case 'pointerout':
      la.delete(t.pointerId)
      break
    case 'gotpointercapture':
    case 'lostpointercapture':
      ua.delete(t.pointerId)
  }
}
function bu(e, t, n, l, u, a) {
  return e === null || e.nativeEvent !== a
    ? ((e = {
        blockedOn: t,
        domEventName: n,
        eventSystemFlags: l,
        nativeEvent: a,
        targetContainers: [u]
      }),
      t !== null && ((t = nu(t)), t !== null && mg(t)),
      e)
    : ((e.eventSystemFlags |= l),
      (t = e.targetContainers),
      u !== null && t.indexOf(u) === -1 && t.push(u),
      e)
}
function Xy(e, t, n, l, u) {
  switch (t) {
    case 'focusin':
      return (xn = bu(xn, e, t, n, l, u)), !0
    case 'dragenter':
      return (Tn = bu(Tn, e, t, n, l, u)), !0
    case 'mouseover':
      return (On = bu(On, e, t, n, l, u)), !0
    case 'pointerover':
      var a = u.pointerId
      return la.set(a, bu(la.get(a) || null, e, t, n, l, u)), !0
    case 'gotpointercapture':
      return (a = u.pointerId), ua.set(a, bu(ua.get(a) || null, e, t, n, l, u)), !0
  }
  return !1
}
function gg(e) {
  var t = Yn(e.target)
  if (t !== null) {
    var n = eu(t)
    if (n !== null) {
      if (((t = n.tag), t === 13)) {
        if (((t = Vd(n)), t !== null)) {
          ;(e.blockedOn = t),
            jp(e.priority, function () {
              if (n.tag === 13) {
                var l = tt(),
                  u = wn(n, l)
                u !== null && Xe(u, n, l), co(n, l)
              }
            })
          return
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null
        return
      }
    }
  }
  e.blockedOn = null
}
function li(e) {
  if (e.blockedOn !== null) return !1
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = ef(e.nativeEvent)
    if (n === null) {
      n = e.nativeEvent
      var l = new n.constructor(n.type, n)
      ;(bc = l), n.target.dispatchEvent(l), (bc = null)
    } else return (t = nu(n)), t !== null && mg(t), (e.blockedOn = n), !1
    t.shift()
  }
  return !0
}
function Fs(e, t, n) {
  li(e) && n.delete(t)
}
function Qy() {
  ;(tf = !1),
    xn !== null && li(xn) && (xn = null),
    Tn !== null && li(Tn) && (Tn = null),
    On !== null && li(On) && (On = null),
    la.forEach(Fs),
    ua.forEach(Fs)
}
function Ya(e, t) {
  e.blockedOn === t &&
    ((e.blockedOn = null),
    tf || ((tf = !0), we.unstable_scheduleCallback(we.unstable_NormalPriority, Qy)))
}
var Ga = null
function Ks(e) {
  Ga !== e &&
    ((Ga = e),
    we.unstable_scheduleCallback(we.unstable_NormalPriority, function () {
      Ga === e && (Ga = null)
      for (var t = 0; t < e.length; t += 3) {
        var n = e[t],
          l = e[t + 1],
          u = e[t + 2]
        if (typeof l != 'function') {
          if (oo(l || n) === null) continue
          break
        }
        var a = nu(n)
        a !== null &&
          (e.splice(t, 3),
          (t -= 3),
          Dc(a, { pending: !0, data: u, method: n.method, action: l }, l, u))
      }
    }))
}
function aa(e) {
  function t(c) {
    return Ya(c, e)
  }
  xn !== null && Ya(xn, e),
    Tn !== null && Ya(Tn, e),
    On !== null && Ya(On, e),
    la.forEach(t),
    ua.forEach(t)
  for (var n = 0; n < dn.length; n++) {
    var l = dn[n]
    l.blockedOn === e && (l.blockedOn = null)
  }
  for (; 0 < dn.length && ((n = dn[0]), n.blockedOn === null); )
    gg(n), n.blockedOn === null && dn.shift()
  if (((n = (e.ownerDocument || e).$$reactFormReplay), n != null))
    for (l = 0; l < n.length; l += 3) {
      var u = n[l],
        a = n[l + 1],
        i = u[Fe] || null
      if (typeof a == 'function') i || Ks(n)
      else if (i) {
        var r = null
        if (a && a.hasAttribute('formAction')) {
          if (((u = a), (i = a[Fe] || null))) r = i.formAction
          else if (oo(u) !== null) continue
        } else r = i.action
        typeof r == 'function' ? (n[l + 1] = r) : (n.splice(l, 3), (l -= 3)), Ks(n)
      }
    }
}
function so(e) {
  this._internalRoot = e
}
tr.prototype.render = so.prototype.render = function (e) {
  var t = this._internalRoot
  if (t === null) throw Error(T(409))
  var n = t.current,
    l = tt()
  dg(n, l, e, t, null, null)
}
tr.prototype.unmount = so.prototype.unmount = function () {
  var e = this._internalRoot
  if (e !== null) {
    this._internalRoot = null
    var t = e.containerInfo
    e.tag === 0 && ql(), dg(e.current, 2, null, e, null, null), Pi(), (t[tu] = null)
  }
}
function tr(e) {
  this._internalRoot = e
}
tr.prototype.unstable_scheduleHydration = function (e) {
  if (e) {
    var t = tm()
    e = { blockedOn: null, target: e, priority: t }
    for (var n = 0; n < dn.length && t !== 0 && t < dn[n].priority; n++);
    dn.splice(n, 0, e), n === 0 && gg(e)
  }
}
var Js = $d.version
if (Js !== '19.0.0') throw Error(T(527, Js, '19.0.0'))
ne.findDOMNode = function (e) {
  var t = e._reactInternals
  if (t === void 0)
    throw typeof e.render == 'function'
      ? Error(T(188))
      : ((e = Object.keys(e).join(',')), Error(T(268, e)))
  return (e = Op(t)), (e = e !== null ? Zd(e) : null), (e = e === null ? null : e.stateNode), e
}
var Vy = {
  bundleType: 0,
  version: '19.0.0',
  rendererPackageName: 'react-dom',
  currentDispatcherRef: B,
  findFiberByHostInstance: Yn,
  reconcilerVersion: '19.0.0'
}
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
  var Xa = __REACT_DEVTOOLS_GLOBAL_HOOK__
  if (!Xa.isDisabled && Xa.supportsFiber)
    try {
      ;(fa = Xa.inject(Vy)), (Ie = Xa)
    } catch {}
}
$i.createRoot = function (e, t) {
  if (!Yd(e)) throw Error(T(299))
  var n = !1,
    l = '',
    u = dh,
    a = mh,
    i = hh,
    r = null
  return (
    t != null &&
      (t.unstable_strictMode === !0 && (n = !0),
      t.identifierPrefix !== void 0 && (l = t.identifierPrefix),
      t.onUncaughtError !== void 0 && (u = t.onUncaughtError),
      t.onCaughtError !== void 0 && (a = t.onCaughtError),
      t.onRecoverableError !== void 0 && (i = t.onRecoverableError),
      t.unstable_transitionCallbacks !== void 0 && (r = t.unstable_transitionCallbacks)),
    (t = og(e, 1, !1, null, null, n, l, u, a, i, r, null)),
    (e[tu] = t.current),
    ao(e.nodeType === 8 ? e.parentNode : e),
    new so(t)
  )
}
$i.hydrateRoot = function (e, t, n) {
  if (!Yd(e)) throw Error(T(299))
  var l = !1,
    u = '',
    a = dh,
    i = mh,
    r = hh,
    c = null,
    f = null
  return (
    n != null &&
      (n.unstable_strictMode === !0 && (l = !0),
      n.identifierPrefix !== void 0 && (u = n.identifierPrefix),
      n.onUncaughtError !== void 0 && (a = n.onUncaughtError),
      n.onCaughtError !== void 0 && (i = n.onCaughtError),
      n.onRecoverableError !== void 0 && (r = n.onRecoverableError),
      n.unstable_transitionCallbacks !== void 0 && (c = n.unstable_transitionCallbacks),
      n.formState !== void 0 && (f = n.formState)),
    (t = og(e, 1, !0, t, n ?? null, l, u, a, i, r, c, f)),
    (t.context = sg(null)),
    (n = t.current),
    (l = tt()),
    (u = yn(l)),
    (u.callback = null),
    bn(n, u, l),
    (t.current.lanes = l),
    sa(t, l),
    zt(t),
    (e[tu] = t.current),
    ao(e),
    new tr(t)
  )
}
$i.version = '19.0.0'
function vg() {
  if (
    !(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'
    )
  )
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(vg)
    } catch {}
}
vg(), (Rd.exports = $i)
var Zy = Rd.exports
const pg = typeof document < 'u' ? N.useLayoutEffect : () => {}
function ky(e) {
  const t = d.useRef(null)
  return (
    pg(() => {
      t.current = e
    }, [e]),
    d.useCallback((...n) => {
      const l = t.current
      return l == null ? void 0 : l(...n)
    }, [])
  )
}
const Sa = e => {
    var t
    return (t = e == null ? void 0 : e.ownerDocument) !== null && t !== void 0 ? t : document
  },
  Xn = e => (e && 'window' in e && e.window === e ? e : Sa(e).defaultView || window)
function Fy(e) {
  var t
  return typeof window > 'u' || window.navigator == null
    ? !1
    : ((t = window.navigator.userAgentData) === null || t === void 0
        ? void 0
        : t.brands.some(n => e.test(n.brand))) || e.test(window.navigator.userAgent)
}
function Ky(e) {
  var t
  return typeof window < 'u' && window.navigator != null
    ? e.test(
        ((t = window.navigator.userAgentData) === null || t === void 0 ? void 0 : t.platform) ||
          window.navigator.platform
      )
    : !1
}
function yg(e) {
  let t = null
  return () => (t == null && (t = e()), t)
}
const Jy = yg(function () {
    return Ky(/^Mac/i)
  }),
  Wy = yg(function () {
    return Fy(/Android/i)
  })
function Py(e) {
  return e.mozInputSource === 0 && e.isTrusted
    ? !0
    : Wy() && e.pointerType
    ? e.type === 'click' && e.buttons === 1
    : e.detail === 0 && !e.pointerType
}
class Iy {
  isDefaultPrevented() {
    return this.nativeEvent.defaultPrevented
  }
  preventDefault() {
    ;(this.defaultPrevented = !0), this.nativeEvent.preventDefault()
  }
  stopPropagation() {
    this.nativeEvent.stopPropagation(), (this.isPropagationStopped = () => !0)
  }
  isPropagationStopped() {
    return !1
  }
  persist() {}
  constructor(t, n) {
    ;(this.nativeEvent = n),
      (this.target = n.target),
      (this.currentTarget = n.currentTarget),
      (this.relatedTarget = n.relatedTarget),
      (this.bubbles = n.bubbles),
      (this.cancelable = n.cancelable),
      (this.defaultPrevented = n.defaultPrevented),
      (this.eventPhase = n.eventPhase),
      (this.isTrusted = n.isTrusted),
      (this.timeStamp = n.timeStamp),
      (this.type = t)
  }
}
function bg(e) {
  let t = d.useRef({ isFocused: !1, observer: null })
  pg(() => {
    const l = t.current
    return () => {
      l.observer && (l.observer.disconnect(), (l.observer = null))
    }
  }, [])
  let n = ky(l => {
    e == null || e(l)
  })
  return d.useCallback(
    l => {
      if (
        l.target instanceof HTMLButtonElement ||
        l.target instanceof HTMLInputElement ||
        l.target instanceof HTMLTextAreaElement ||
        l.target instanceof HTMLSelectElement
      ) {
        t.current.isFocused = !0
        let u = l.target,
          a = i => {
            ;(t.current.isFocused = !1),
              u.disabled && n(new Iy('blur', i)),
              t.current.observer && (t.current.observer.disconnect(), (t.current.observer = null))
          }
        u.addEventListener('focusout', a, { once: !0 }),
          (t.current.observer = new MutationObserver(() => {
            if (t.current.isFocused && u.disabled) {
              var i
              ;(i = t.current.observer) === null || i === void 0 || i.disconnect()
              let r = u === document.activeElement ? null : document.activeElement
              u.dispatchEvent(new FocusEvent('blur', { relatedTarget: r })),
                u.dispatchEvent(new FocusEvent('focusout', { bubbles: !0, relatedTarget: r }))
            }
          })),
          t.current.observer.observe(u, { attributes: !0, attributeFilter: ['disabled'] })
      }
    },
    [n]
  )
}
function eb(e) {
  let { isDisabled: t, onFocus: n, onBlur: l, onFocusChange: u } = e
  const a = d.useCallback(
      c => {
        if (c.target === c.currentTarget) return l && l(c), u && u(!1), !0
      },
      [l, u]
    ),
    i = bg(a),
    r = d.useCallback(
      c => {
        const f = Sa(c.target)
        c.target === c.currentTarget &&
          f.activeElement === c.target &&
          (n && n(c), u && u(!0), i(c))
      },
      [u, n, i]
    )
  return {
    focusProps: { onFocus: !t && (n || u || l) ? r : void 0, onBlur: !t && (l || u) ? a : void 0 }
  }
}
let xa = null,
  nf = new Set(),
  Xu = new Map(),
  ll = !1,
  lf = !1
const tb = { Tab: !0, Escape: !0 }
function mo(e, t) {
  for (let n of nf) n(e, t)
}
function nb(e) {
  return !(
    e.metaKey ||
    (!Jy() && e.altKey) ||
    e.ctrlKey ||
    e.key === 'Control' ||
    e.key === 'Shift' ||
    e.key === 'Meta'
  )
}
function zi(e) {
  ;(ll = !0), nb(e) && ((xa = 'keyboard'), mo('keyboard', e))
}
function ot(e) {
  ;(xa = 'pointer'),
    (e.type === 'mousedown' || e.type === 'pointerdown') && ((ll = !0), mo('pointer', e))
}
function Eg(e) {
  Py(e) && ((ll = !0), (xa = 'virtual'))
}
function Sg(e) {
  e.target === window ||
    e.target === document ||
    (!ll && !lf && ((xa = 'virtual'), mo('virtual', e)), (ll = !1), (lf = !1))
}
function xg() {
  ;(ll = !1), (lf = !0)
}
function uf(e) {
  if (typeof window > 'u' || Xu.get(Xn(e))) return
  const t = Xn(e),
    n = Sa(e)
  let l = t.HTMLElement.prototype.focus
  ;(t.HTMLElement.prototype.focus = function () {
    ;(ll = !0), l.apply(this, arguments)
  }),
    n.addEventListener('keydown', zi, !0),
    n.addEventListener('keyup', zi, !0),
    n.addEventListener('click', Eg, !0),
    t.addEventListener('focus', Sg, !0),
    t.addEventListener('blur', xg, !1),
    typeof PointerEvent < 'u'
      ? (n.addEventListener('pointerdown', ot, !0),
        n.addEventListener('pointermove', ot, !0),
        n.addEventListener('pointerup', ot, !0))
      : (n.addEventListener('mousedown', ot, !0),
        n.addEventListener('mousemove', ot, !0),
        n.addEventListener('mouseup', ot, !0)),
    t.addEventListener(
      'beforeunload',
      () => {
        Tg(e)
      },
      { once: !0 }
    ),
    Xu.set(t, { focus: l })
}
const Tg = (e, t) => {
  const n = Xn(e),
    l = Sa(e)
  t && l.removeEventListener('DOMContentLoaded', t),
    Xu.has(n) &&
      ((n.HTMLElement.prototype.focus = Xu.get(n).focus),
      l.removeEventListener('keydown', zi, !0),
      l.removeEventListener('keyup', zi, !0),
      l.removeEventListener('click', Eg, !0),
      n.removeEventListener('focus', Sg, !0),
      n.removeEventListener('blur', xg, !1),
      typeof PointerEvent < 'u'
        ? (l.removeEventListener('pointerdown', ot, !0),
          l.removeEventListener('pointermove', ot, !0),
          l.removeEventListener('pointerup', ot, !0))
        : (l.removeEventListener('mousedown', ot, !0),
          l.removeEventListener('mousemove', ot, !0),
          l.removeEventListener('mouseup', ot, !0)),
      Xu.delete(n))
}
function lb(e) {
  const t = Sa(e)
  let n
  return (
    t.readyState !== 'loading'
      ? uf(e)
      : ((n = () => {
          uf(e)
        }),
        t.addEventListener('DOMContentLoaded', n)),
    () => Tg(e, n)
  )
}
typeof document < 'u' && lb()
function Og() {
  return xa !== 'pointer'
}
const ub = new Set([
  'checkbox',
  'radio',
  'range',
  'color',
  'file',
  'image',
  'button',
  'submit',
  'reset'
])
function ab(e, t, n) {
  var l
  const u =
      typeof window < 'u' ? Xn(n == null ? void 0 : n.target).HTMLInputElement : HTMLInputElement,
    a =
      typeof window < 'u'
        ? Xn(n == null ? void 0 : n.target).HTMLTextAreaElement
        : HTMLTextAreaElement,
    i = typeof window < 'u' ? Xn(n == null ? void 0 : n.target).HTMLElement : HTMLElement,
    r = typeof window < 'u' ? Xn(n == null ? void 0 : n.target).KeyboardEvent : KeyboardEvent
  return (
    (e =
      e ||
      ((n == null ? void 0 : n.target) instanceof u &&
        !ub.has(n == null || (l = n.target) === null || l === void 0 ? void 0 : l.type)) ||
      (n == null ? void 0 : n.target) instanceof a ||
      ((n == null ? void 0 : n.target) instanceof i &&
        (n == null ? void 0 : n.target.isContentEditable))),
    !(e && t === 'keyboard' && n instanceof r && !tb[n.key])
  )
}
function ib(e, t, n) {
  uf(),
    d.useEffect(() => {
      let l = (u, a) => {
        ab(!!(n != null && n.isTextInput), u, a) && e(Og())
      }
      return (
        nf.add(l),
        () => {
          nf.delete(l)
        }
      )
    }, t)
}
function rb(e) {
  let { isDisabled: t, onBlurWithin: n, onFocusWithin: l, onFocusWithinChange: u } = e,
    a = d.useRef({ isFocusWithin: !1 }),
    i = d.useCallback(
      f => {
        a.current.isFocusWithin &&
          !f.currentTarget.contains(f.relatedTarget) &&
          ((a.current.isFocusWithin = !1), n && n(f), u && u(!1))
      },
      [n, u, a]
    ),
    r = bg(i),
    c = d.useCallback(
      f => {
        !a.current.isFocusWithin &&
          document.activeElement === f.target &&
          (l && l(f), u && u(!0), (a.current.isFocusWithin = !0), r(f))
      },
      [l, u, r]
    )
  return t
    ? { focusWithinProps: { onFocus: void 0, onBlur: void 0 } }
    : { focusWithinProps: { onFocus: c, onBlur: i } }
}
let Hi = !1,
  Pr = 0
function af() {
  ;(Hi = !0),
    setTimeout(() => {
      Hi = !1
    }, 50)
}
function Ws(e) {
  e.pointerType === 'touch' && af()
}
function cb() {
  if (!(typeof document > 'u'))
    return (
      typeof PointerEvent < 'u'
        ? document.addEventListener('pointerup', Ws)
        : document.addEventListener('touchend', af),
      Pr++,
      () => {
        Pr--,
          !(Pr > 0) &&
            (typeof PointerEvent < 'u'
              ? document.removeEventListener('pointerup', Ws)
              : document.removeEventListener('touchend', af))
      }
    )
}
function wg(e) {
  let { onHoverStart: t, onHoverChange: n, onHoverEnd: l, isDisabled: u } = e,
    [a, i] = d.useState(!1),
    r = d.useRef({
      isHovered: !1,
      ignoreEmulatedMouseEvents: !1,
      pointerType: '',
      target: null
    }).current
  d.useEffect(cb, [])
  let { hoverProps: c, triggerHoverEnd: f } = d.useMemo(() => {
    let o = (s, y) => {
        if (
          ((r.pointerType = y),
          u || y === 'touch' || r.isHovered || !s.currentTarget.contains(s.target))
        )
          return
        r.isHovered = !0
        let E = s.currentTarget
        ;(r.target = E),
          t && t({ type: 'hoverstart', target: E, pointerType: y }),
          n && n(!0),
          i(!0)
      },
      g = (s, y) => {
        if (((r.pointerType = ''), (r.target = null), y === 'touch' || !r.isHovered)) return
        r.isHovered = !1
        let E = s.currentTarget
        l && l({ type: 'hoverend', target: E, pointerType: y }), n && n(!1), i(!1)
      },
      m = {}
    return (
      typeof PointerEvent < 'u'
        ? ((m.onPointerEnter = s => {
            ;(Hi && s.pointerType === 'mouse') || o(s, s.pointerType)
          }),
          (m.onPointerLeave = s => {
            !u && s.currentTarget.contains(s.target) && g(s, s.pointerType)
          }))
        : ((m.onTouchStart = () => {
            r.ignoreEmulatedMouseEvents = !0
          }),
          (m.onMouseEnter = s => {
            !r.ignoreEmulatedMouseEvents && !Hi && o(s, 'mouse'), (r.ignoreEmulatedMouseEvents = !1)
          }),
          (m.onMouseLeave = s => {
            !u && s.currentTarget.contains(s.target) && g(s, 'mouse')
          })),
      { hoverProps: m, triggerHoverEnd: g }
    )
  }, [t, n, l, u, r])
  return (
    d.useEffect(() => {
      u && f({ currentTarget: r.target }, r.pointerType)
    }, [u]),
    { hoverProps: c, isHovered: a }
  )
}
function Ag(e = {}) {
  let { autoFocus: t = !1, isTextInput: n, within: l } = e,
    u = d.useRef({ isFocused: !1, isFocusVisible: t || Og() }),
    [a, i] = d.useState(!1),
    [r, c] = d.useState(() => u.current.isFocused && u.current.isFocusVisible),
    f = d.useCallback(() => c(u.current.isFocused && u.current.isFocusVisible), []),
    o = d.useCallback(
      s => {
        ;(u.current.isFocused = s), i(s), f()
      },
      [f]
    )
  ib(
    s => {
      ;(u.current.isFocusVisible = s), f()
    },
    [],
    { isTextInput: n }
  )
  let { focusProps: g } = eb({ isDisabled: l, onFocusChange: o }),
    { focusWithinProps: m } = rb({ isDisabled: !l, onFocusWithinChange: o })
  return { isFocused: a, isFocusVisible: r, focusProps: l ? m : g }
}
var fb = Object.defineProperty,
  ob = (e, t, n) =>
    t in e ? fb(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (e[t] = n),
  Ir = (e, t, n) => (ob(e, typeof t != 'symbol' ? t + '' : t, n), n)
let sb = class {
    constructor() {
      Ir(this, 'current', this.detect()),
        Ir(this, 'handoffState', 'pending'),
        Ir(this, 'currentId', 0)
    }
    set(t) {
      this.current !== t &&
        ((this.handoffState = 'pending'), (this.currentId = 0), (this.current = t))
    }
    reset() {
      this.set(this.detect())
    }
    nextId() {
      return ++this.currentId
    }
    get isServer() {
      return this.current === 'server'
    }
    get isClient() {
      return this.current === 'client'
    }
    detect() {
      return typeof window > 'u' || typeof document > 'u' ? 'server' : 'client'
    }
    handoff() {
      this.handoffState === 'pending' && (this.handoffState = 'complete')
    }
    get isHandoffComplete() {
      return this.handoffState === 'complete'
    }
  },
  Wn = new sb()
function iu(e) {
  return Wn.isServer
    ? null
    : e instanceof Node
    ? e.ownerDocument
    : e != null && e.hasOwnProperty('current') && e.current instanceof Node
    ? e.current.ownerDocument
    : document
}
function nr(e) {
  typeof queueMicrotask == 'function'
    ? queueMicrotask(e)
    : Promise.resolve()
        .then(e)
        .catch(t =>
          setTimeout(() => {
            throw t
          })
        )
}
function en() {
  let e = [],
    t = {
      addEventListener(n, l, u, a) {
        return n.addEventListener(l, u, a), t.add(() => n.removeEventListener(l, u, a))
      },
      requestAnimationFrame(...n) {
        let l = requestAnimationFrame(...n)
        return t.add(() => cancelAnimationFrame(l))
      },
      nextFrame(...n) {
        return t.requestAnimationFrame(() => t.requestAnimationFrame(...n))
      },
      setTimeout(...n) {
        let l = setTimeout(...n)
        return t.add(() => clearTimeout(l))
      },
      microTask(...n) {
        let l = { current: !0 }
        return (
          nr(() => {
            l.current && n[0]()
          }),
          t.add(() => {
            l.current = !1
          })
        )
      },
      style(n, l, u) {
        let a = n.style.getPropertyValue(l)
        return (
          Object.assign(n.style, { [l]: u }),
          this.add(() => {
            Object.assign(n.style, { [l]: a })
          })
        )
      },
      group(n) {
        let l = en()
        return n(l), this.add(() => l.dispose())
      },
      add(n) {
        return (
          e.includes(n) || e.push(n),
          () => {
            let l = e.indexOf(n)
            if (l >= 0) for (let u of e.splice(l, 1)) u()
          }
        )
      },
      dispose() {
        for (let n of e.splice(0)) n()
      }
    }
  return t
}
function tn() {
  let [e] = d.useState(en)
  return d.useEffect(() => () => e.dispose(), [e]), e
}
let le = (e, t) => {
  Wn.isServer ? d.useEffect(e, t) : d.useLayoutEffect(e, t)
}
function zn(e) {
  let t = d.useRef(e)
  return (
    le(() => {
      t.current = e
    }, [e]),
    t
  )
}
let j = function (e) {
  let t = zn(e)
  return N.useCallback((...n) => t.current(...n), [t])
}
function db(e) {
  let t = e.width / 2,
    n = e.height / 2
  return { top: e.clientY - n, right: e.clientX + t, bottom: e.clientY + n, left: e.clientX - t }
}
function mb(e, t) {
  return !(!e || !t || e.right < t.left || e.left > t.right || e.bottom < t.top || e.top > t.bottom)
}
function Rg({ disabled: e = !1 } = {}) {
  let t = d.useRef(null),
    [n, l] = d.useState(!1),
    u = tn(),
    a = j(() => {
      ;(t.current = null), l(!1), u.dispose()
    }),
    i = j(r => {
      if ((u.dispose(), t.current === null)) {
        ;(t.current = r.currentTarget), l(!0)
        {
          let c = iu(r.currentTarget)
          u.addEventListener(c, 'pointerup', a, !1),
            u.addEventListener(
              c,
              'pointermove',
              f => {
                if (t.current) {
                  let o = db(f)
                  l(mb(o, t.current.getBoundingClientRect()))
                }
              },
              !1
            ),
            u.addEventListener(c, 'pointercancel', a, !1)
        }
      }
    })
  return { pressed: n, pressProps: e ? {} : { onPointerDown: i, onPointerUp: a, onClick: a } }
}
let hb = d.createContext(void 0)
function lr() {
  return d.useContext(hb)
}
function rf(...e) {
  return Array.from(new Set(e.flatMap(t => (typeof t == 'string' ? t.split(' ') : []))))
    .filter(Boolean)
    .join(' ')
}
function ke(e, t, ...n) {
  if (e in t) {
    let u = t[e]
    return typeof u == 'function' ? u(...n) : u
  }
  let l = new Error(
    `Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(
      t
    )
      .map(u => `"${u}"`)
      .join(', ')}.`
  )
  throw (Error.captureStackTrace && Error.captureStackTrace(l, ke), l)
}
var Jl = (e => (
    (e[(e.None = 0)] = 'None'),
    (e[(e.RenderStrategy = 1)] = 'RenderStrategy'),
    (e[(e.Static = 2)] = 'Static'),
    e
  ))(Jl || {}),
  vn = (e => ((e[(e.Unmount = 0)] = 'Unmount'), (e[(e.Hidden = 1)] = 'Hidden'), e))(vn || {})
function be() {
  let e = vb()
  return d.useCallback(t => gb({ mergeRefs: e, ...t }), [e])
}
function gb({
  ourProps: e,
  theirProps: t,
  slot: n,
  defaultTag: l,
  features: u,
  visible: a = !0,
  name: i,
  mergeRefs: r
}) {
  r = r ?? pb
  let c = Mg(t, e)
  if (a) return Qa(c, n, l, i, r)
  let f = u ?? 0
  if (f & 2) {
    let { static: o = !1, ...g } = c
    if (o) return Qa(g, n, l, i, r)
  }
  if (f & 1) {
    let { unmount: o = !0, ...g } = c
    return ke(o ? 0 : 1, {
      0() {
        return null
      },
      1() {
        return Qa({ ...g, hidden: !0, style: { display: 'none' } }, n, l, i, r)
      }
    })
  }
  return Qa(c, n, l, i, r)
}
function Qa(e, t = {}, n, l, u) {
  let { as: a = n, children: i, refName: r = 'ref', ...c } = ec(e, ['unmount', 'static']),
    f = e.ref !== void 0 ? { [r]: e.ref } : {},
    o = typeof i == 'function' ? i(t) : i
  'className' in c &&
    c.className &&
    typeof c.className == 'function' &&
    (c.className = c.className(t)),
    c['aria-labelledby'] && c['aria-labelledby'] === c.id && (c['aria-labelledby'] = void 0)
  let g = {}
  if (t) {
    let m = !1,
      s = []
    for (let [y, E] of Object.entries(t))
      typeof E == 'boolean' && (m = !0),
        E === !0 && s.push(y.replace(/([A-Z])/g, x => `-${x.toLowerCase()}`))
    if (m) {
      g['data-headlessui-state'] = s.join(' ')
      for (let y of s) g[`data-${y}`] = ''
    }
  }
  if (a === d.Fragment && (Object.keys(cn(c)).length > 0 || Object.keys(cn(g)).length > 0))
    if (!d.isValidElement(o) || (Array.isArray(o) && o.length > 1)) {
      if (Object.keys(cn(c)).length > 0)
        throw new Error(
          [
            'Passing props on "Fragment"!',
            '',
            `The current component <${l} /> is rendering a "Fragment".`,
            'However we need to passthrough the following props:',
            Object.keys(cn(c))
              .concat(Object.keys(cn(g)))
              .map(m => `  - ${m}`).join(`
`),
            '',
            'You can apply a few solutions:',
            [
              'Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".',
              'Render a single element as the child so that we can forward the props onto that element.'
            ].map(m => `  - ${m}`).join(`
`)
          ].join(`
`)
        )
    } else {
      let m = o.props,
        s = m == null ? void 0 : m.className,
        y = typeof s == 'function' ? (...v) => rf(s(...v), c.className) : rf(s, c.className),
        E = y ? { className: y } : {},
        x = Mg(o.props, cn(ec(c, ['ref'])))
      for (let v in g) v in x && delete g[v]
      return d.cloneElement(o, Object.assign({}, x, g, f, { ref: u(yb(o), f.ref) }, E))
    }
  return d.createElement(
    a,
    Object.assign({}, ec(c, ['ref']), a !== d.Fragment && f, a !== d.Fragment && g),
    o
  )
}
function vb() {
  let e = d.useRef([]),
    t = d.useCallback(n => {
      for (let l of e.current) l != null && (typeof l == 'function' ? l(n) : (l.current = n))
    }, [])
  return (...n) => {
    if (!n.every(l => l == null)) return (e.current = n), t
  }
}
function pb(...e) {
  return e.every(t => t == null)
    ? void 0
    : t => {
        for (let n of e) n != null && (typeof n == 'function' ? n(t) : (n.current = t))
      }
}
function Mg(...e) {
  if (e.length === 0) return {}
  if (e.length === 1) return e[0]
  let t = {},
    n = {}
  for (let l of e)
    for (let u in l)
      u.startsWith('on') && typeof l[u] == 'function'
        ? (n[u] != null || (n[u] = []), n[u].push(l[u]))
        : (t[u] = l[u])
  if (t.disabled || t['aria-disabled'])
    for (let l in n)
      /^(on(?:Click|Pointer|Mouse|Key)(?:Down|Up|Press)?)$/.test(l) &&
        (n[l] = [
          u => {
            var a
            return (a = u == null ? void 0 : u.preventDefault) == null ? void 0 : a.call(u)
          }
        ])
  for (let l in n)
    Object.assign(t, {
      [l](u, ...a) {
        let i = n[l]
        for (let r of i) {
          if (
            (u instanceof Event || (u == null ? void 0 : u.nativeEvent) instanceof Event) &&
            u.defaultPrevented
          )
            return
          r(u, ...a)
        }
      }
    })
  return t
}
function ho(...e) {
  if (e.length === 0) return {}
  if (e.length === 1) return e[0]
  let t = {},
    n = {}
  for (let l of e)
    for (let u in l)
      u.startsWith('on') && typeof l[u] == 'function'
        ? (n[u] != null || (n[u] = []), n[u].push(l[u]))
        : (t[u] = l[u])
  for (let l in n)
    Object.assign(t, {
      [l](...u) {
        let a = n[l]
        for (let i of a) i == null || i(...u)
      }
    })
  return t
}
function ge(e) {
  var t
  return Object.assign(d.forwardRef(e), { displayName: (t = e.displayName) != null ? t : e.name })
}
function cn(e) {
  let t = Object.assign({}, e)
  for (let n in t) t[n] === void 0 && delete t[n]
  return t
}
function ec(e, t = []) {
  let n = Object.assign({}, e)
  for (let l of t) l in n && delete n[l]
  return n
}
function yb(e) {
  return N.version.split('.')[0] >= '19' ? e.props.ref : e.ref
}
function Dg(e, t, n) {
  let [l, u] = d.useState(n),
    a = e !== void 0,
    i = d.useRef(a),
    r = d.useRef(!1),
    c = d.useRef(!1)
  return (
    a && !i.current && !r.current
      ? ((r.current = !0), (i.current = a))
      : !a && i.current && !c.current && ((c.current = !0), (i.current = a)),
    [a ? e : l, j(f => (a || u(f), t == null ? void 0 : t(f)))]
  )
}
function _g(e) {
  let [t] = d.useState(e)
  return t
}
function Cg(e = {}, t = null, n = []) {
  for (let [l, u] of Object.entries(e)) zg(n, Ng(t, l), u)
  return n
}
function Ng(e, t) {
  return e ? e + '[' + t + ']' : t
}
function zg(e, t, n) {
  if (Array.isArray(n)) for (let [l, u] of n.entries()) zg(e, Ng(t, l.toString()), u)
  else
    n instanceof Date
      ? e.push([t, n.toISOString()])
      : typeof n == 'boolean'
      ? e.push([t, n ? '1' : '0'])
      : typeof n == 'string'
      ? e.push([t, n])
      : typeof n == 'number'
      ? e.push([t, `${n}`])
      : n == null
      ? e.push([t, ''])
      : Cg(n, t, e)
}
function Hg(e) {
  var t, n
  let l = (t = e == null ? void 0 : e.form) != null ? t : e.closest('form')
  if (l) {
    for (let u of l.elements)
      if (
        u !== e &&
        ((u.tagName === 'INPUT' && u.type === 'submit') ||
          (u.tagName === 'BUTTON' && u.type === 'submit') ||
          (u.nodeName === 'INPUT' && u.type === 'image'))
      ) {
        u.click()
        return
      }
    ;(n = l.requestSubmit) == null || n.call(l)
  }
}
let bb = 'span'
var Wl = (e => (
  (e[(e.None = 1)] = 'None'),
  (e[(e.Focusable = 2)] = 'Focusable'),
  (e[(e.Hidden = 4)] = 'Hidden'),
  e
))(Wl || {})
function Eb(e, t) {
  var n
  let { features: l = 1, ...u } = e,
    a = {
      'ref': t,
      'aria-hidden': (l & 2) === 2 ? !0 : (n = u['aria-hidden']) != null ? n : void 0,
      'hidden': (l & 4) === 4 ? !0 : void 0,
      'style': {
        position: 'fixed',
        top: 1,
        left: 1,
        width: 1,
        height: 0,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: '0',
        ...((l & 4) === 4 && (l & 2) !== 2 && { display: 'none' })
      }
    }
  return be()({ ourProps: a, theirProps: u, slot: {}, defaultTag: bb, name: 'Hidden' })
}
let ia = ge(Eb),
  Sb = d.createContext(null)
function xb({ children: e }) {
  let t = d.useContext(Sb)
  if (!t) return N.createElement(N.Fragment, null, e)
  let { target: n } = t
  return n ? Ze.createPortal(N.createElement(N.Fragment, null, e), n) : null
}
function Lg({ data: e, form: t, disabled: n, onReset: l, overrides: u }) {
  let [a, i] = d.useState(null),
    r = tn()
  return (
    d.useEffect(() => {
      if (l && a) return r.addEventListener(a, 'reset', l)
    }, [a, t, l]),
    N.createElement(
      xb,
      null,
      N.createElement(Tb, { setForm: i, formId: t }),
      Cg(e).map(([c, f]) =>
        N.createElement(ia, {
          features: Wl.Hidden,
          ...cn({
            key: c,
            as: 'input',
            type: 'hidden',
            hidden: !0,
            readOnly: !0,
            form: t,
            disabled: n,
            name: c,
            value: f,
            ...u
          })
        })
      )
    )
  )
}
function Tb({ setForm: e, formId: t }) {
  return (
    d.useEffect(() => {
      if (t) {
        let n = document.getElementById(t)
        n && e(n)
      }
    }, [e, t]),
    t
      ? null
      : N.createElement(ia, {
          features: Wl.Hidden,
          as: 'input',
          type: 'hidden',
          hidden: !0,
          readOnly: !0,
          ref: n => {
            if (!n) return
            let l = n.closest('form')
            l && e(l)
          }
        })
  )
}
let Ob = d.createContext(void 0)
function go() {
  return d.useContext(Ob)
}
function Ug(e) {
  let t = e.parentElement,
    n = null
  for (; t && !(t instanceof HTMLFieldSetElement); )
    t instanceof HTMLLegendElement && (n = t), (t = t.parentElement)
  let l = (t == null ? void 0 : t.getAttribute('disabled')) === ''
  return l && wb(n) ? !1 : l
}
function wb(e) {
  if (!e) return !1
  let t = e.previousElementSibling
  for (; t !== null; ) {
    if (t instanceof HTMLLegendElement) return !1
    t = t.previousElementSibling
  }
  return !0
}
let jg = Symbol()
function Ab(e, t = !0) {
  return Object.assign(e, { [jg]: t })
}
function He(...e) {
  let t = d.useRef(e)
  d.useEffect(() => {
    t.current = e
  }, [e])
  let n = j(l => {
    for (let u of t.current) u != null && (typeof u == 'function' ? u(l) : (u.current = l))
  })
  return e.every(l => l == null || (l == null ? void 0 : l[jg])) ? void 0 : n
}
let ur = d.createContext(null)
ur.displayName = 'DescriptionContext'
function qg() {
  let e = d.useContext(ur)
  if (e === null) {
    let t = new Error(
      'You used a <Description /> component, but it is not inside a relevant parent.'
    )
    throw (Error.captureStackTrace && Error.captureStackTrace(t, qg), t)
  }
  return e
}
function Bg() {
  var e, t
  return (t = (e = d.useContext(ur)) == null ? void 0 : e.value) != null ? t : void 0
}
function $g() {
  let [e, t] = d.useState([])
  return [
    e.length > 0 ? e.join(' ') : void 0,
    d.useMemo(
      () =>
        function (n) {
          let l = j(
              a => (
                t(i => [...i, a]),
                () =>
                  t(i => {
                    let r = i.slice(),
                      c = r.indexOf(a)
                    return c !== -1 && r.splice(c, 1), r
                  })
              )
            ),
            u = d.useMemo(
              () => ({ register: l, slot: n.slot, name: n.name, props: n.props, value: n.value }),
              [l, n.slot, n.name, n.props, n.value]
            )
          return N.createElement(ur.Provider, { value: u }, n.children)
        },
      [t]
    )
  ]
}
let Rb = 'p'
function Mb(e, t) {
  let n = d.useId(),
    l = lr(),
    { id: u = `headlessui-description-${n}`, ...a } = e,
    i = qg(),
    r = He(t)
  le(() => i.register(u), [u, i.register])
  let c = l || !1,
    f = d.useMemo(() => ({ ...i.slot, disabled: c }), [i.slot, c]),
    o = { ref: r, ...i.props, id: u }
  return be()({
    ourProps: o,
    theirProps: a,
    slot: f,
    defaultTag: Rb,
    name: i.name || 'Description'
  })
}
let Db = ge(Mb),
  Yg = Object.assign(Db, {})
var he = (e => (
  (e.Space = ' '),
  (e.Enter = 'Enter'),
  (e.Escape = 'Escape'),
  (e.Backspace = 'Backspace'),
  (e.Delete = 'Delete'),
  (e.ArrowLeft = 'ArrowLeft'),
  (e.ArrowUp = 'ArrowUp'),
  (e.ArrowRight = 'ArrowRight'),
  (e.ArrowDown = 'ArrowDown'),
  (e.Home = 'Home'),
  (e.End = 'End'),
  (e.PageUp = 'PageUp'),
  (e.PageDown = 'PageDown'),
  (e.Tab = 'Tab'),
  e
))(he || {})
let ar = d.createContext(null)
ar.displayName = 'LabelContext'
function Gg() {
  let e = d.useContext(ar)
  if (e === null) {
    let t = new Error('You used a <Label /> component, but it is not inside a relevant parent.')
    throw (Error.captureStackTrace && Error.captureStackTrace(t, Gg), t)
  }
  return e
}
function vo(e) {
  var t, n, l
  let u = (n = (t = d.useContext(ar)) == null ? void 0 : t.value) != null ? n : void 0
  return ((l = e == null ? void 0 : e.length) != null ? l : 0) > 0
    ? [u, ...e].filter(Boolean).join(' ')
    : u
}
function Xg({ inherit: e = !1 } = {}) {
  let t = vo(),
    [n, l] = d.useState([]),
    u = e ? [t, ...n].filter(Boolean) : n
  return [
    u.length > 0 ? u.join(' ') : void 0,
    d.useMemo(
      () =>
        function (a) {
          let i = j(
              c => (
                l(f => [...f, c]),
                () =>
                  l(f => {
                    let o = f.slice(),
                      g = o.indexOf(c)
                    return g !== -1 && o.splice(g, 1), o
                  })
              )
            ),
            r = d.useMemo(
              () => ({ register: i, slot: a.slot, name: a.name, props: a.props, value: a.value }),
              [i, a.slot, a.name, a.props, a.value]
            )
          return N.createElement(ar.Provider, { value: r }, a.children)
        },
      [l]
    )
  ]
}
let _b = 'label'
function Cb(e, t) {
  var n
  let l = d.useId(),
    u = Gg(),
    a = go(),
    i = lr(),
    {
      id: r = `headlessui-label-${l}`,
      htmlFor: c = a ?? ((n = u.props) == null ? void 0 : n.htmlFor),
      passive: f = !1,
      ...o
    } = e,
    g = He(t)
  le(() => u.register(r), [r, u.register])
  let m = j(x => {
      let v = x.currentTarget
      if (
        (v instanceof HTMLLabelElement && x.preventDefault(),
        u.props &&
          'onClick' in u.props &&
          typeof u.props.onClick == 'function' &&
          u.props.onClick(x),
        v instanceof HTMLLabelElement)
      ) {
        let h = document.getElementById(v.htmlFor)
        if (h) {
          let p = h.getAttribute('disabled')
          if (p === 'true' || p === '') return
          let b = h.getAttribute('aria-disabled')
          if (b === 'true' || b === '') return
          ;((h instanceof HTMLInputElement && (h.type === 'radio' || h.type === 'checkbox')) ||
            h.role === 'radio' ||
            h.role === 'checkbox' ||
            h.role === 'switch') &&
            h.click(),
            h.focus({ preventScroll: !0 })
        }
      }
    }),
    s = i || !1,
    y = d.useMemo(() => ({ ...u.slot, disabled: s }), [u.slot, s]),
    E = { ref: g, ...u.props, id: r, htmlFor: c, onClick: m }
  return (
    f &&
      ('onClick' in E && (delete E.htmlFor, delete E.onClick), 'onClick' in o && delete o.onClick),
    be()({
      ourProps: E,
      theirProps: o,
      slot: y,
      defaultTag: c ? _b : 'div',
      name: u.name || 'Label'
    })
  )
}
let Nb = ge(Cb),
  Qg = Object.assign(Nb, {}),
  zb = d.createContext(() => {})
function Hb({ value: e, children: t }) {
  return N.createElement(zb.Provider, { value: e }, t)
}
function Lb(e, t) {
  return e !== null &&
    t !== null &&
    typeof e == 'object' &&
    typeof t == 'object' &&
    'id' in e &&
    'id' in t
    ? e.id === t.id
    : e === t
}
function Ub(e = Lb) {
  return d.useCallback(
    (t, n) => {
      if (typeof e == 'string') {
        let l = e
        return (t == null ? void 0 : t[l]) === (n == null ? void 0 : n[l])
      }
      return e(t, n)
    },
    [e]
  )
}
function jb(e) {
  if (e === null) return { width: 0, height: 0 }
  let { width: t, height: n } = e.getBoundingClientRect()
  return { width: t, height: n }
}
function qb(e, t = !1) {
  let [n, l] = d.useReducer(() => ({}), {}),
    u = d.useMemo(() => jb(e), [e, n])
  return (
    le(() => {
      if (!e) return
      let a = new ResizeObserver(l)
      return (
        a.observe(e),
        () => {
          a.disconnect()
        }
      )
    }, [e]),
    t ? { width: `${u.width}px`, height: `${u.height}px` } : u
  )
}
let Bb = class extends Map {
  constructor(t) {
    super(), (this.factory = t)
  }
  get(t) {
    let n = super.get(t)
    return n === void 0 && ((n = this.factory(t)), this.set(t, n)), n
  }
}
function Vg(e, t) {
  let n = e(),
    l = new Set()
  return {
    getSnapshot() {
      return n
    },
    subscribe(u) {
      return l.add(u), () => l.delete(u)
    },
    dispatch(u, ...a) {
      let i = t[u].call(n, ...a)
      i && ((n = i), l.forEach(r => r()))
    }
  }
}
function Zg(e) {
  return d.useSyncExternalStore(e.subscribe, e.getSnapshot, e.getSnapshot)
}
let $b = new Bb(() =>
  Vg(() => [], {
    ADD(e) {
      return this.includes(e) ? this : [...this, e]
    },
    REMOVE(e) {
      let t = this.indexOf(e)
      if (t === -1) return this
      let n = this.slice()
      return n.splice(t, 1), n
    }
  })
)
function ru(e, t) {
  let n = $b.get(t),
    l = d.useId(),
    u = Zg(n)
  if (
    (le(() => {
      if (e) return n.dispatch('ADD', l), () => n.dispatch('REMOVE', l)
    }, [n, e]),
    !e)
  )
    return !1
  let a = u.indexOf(l),
    i = u.length
  return a === -1 && ((a = i), (i += 1)), a === i - 1
}
let cf = new Map(),
  Qu = new Map()
function Ps(e) {
  var t
  let n = (t = Qu.get(e)) != null ? t : 0
  return (
    Qu.set(e, n + 1),
    n !== 0
      ? () => Is(e)
      : (cf.set(e, { 'aria-hidden': e.getAttribute('aria-hidden'), 'inert': e.inert }),
        e.setAttribute('aria-hidden', 'true'),
        (e.inert = !0),
        () => Is(e))
  )
}
function Is(e) {
  var t
  let n = (t = Qu.get(e)) != null ? t : 1
  if ((n === 1 ? Qu.delete(e) : Qu.set(e, n - 1), n !== 1)) return
  let l = cf.get(e)
  l &&
    (l['aria-hidden'] === null
      ? e.removeAttribute('aria-hidden')
      : e.setAttribute('aria-hidden', l['aria-hidden']),
    (e.inert = l.inert),
    cf.delete(e))
}
function kg(e, { allowed: t, disallowed: n } = {}) {
  let l = ru(e, 'inert-others')
  le(() => {
    var u, a
    if (!l) return
    let i = en()
    for (let c of (u = n == null ? void 0 : n()) != null ? u : []) c && i.add(Ps(c))
    let r = (a = t == null ? void 0 : t()) != null ? a : []
    for (let c of r) {
      if (!c) continue
      let f = iu(c)
      if (!f) continue
      let o = c.parentElement
      for (; o && o !== f.body; ) {
        for (let g of o.children) r.some(m => g.contains(m)) || i.add(Ps(g))
        o = o.parentElement
      }
    }
    return i.dispose
  }, [l, t, n])
}
function Fg(e, t, n) {
  let l = zn(u => {
    let a = u.getBoundingClientRect()
    a.x === 0 && a.y === 0 && a.width === 0 && a.height === 0 && n()
  })
  d.useEffect(() => {
    if (!e) return
    let u = t === null ? null : t instanceof HTMLElement ? t : t.current
    if (!u) return
    let a = en()
    if (typeof ResizeObserver < 'u') {
      let i = new ResizeObserver(() => l.current(u))
      i.observe(u), a.add(() => i.disconnect())
    }
    if (typeof IntersectionObserver < 'u') {
      let i = new IntersectionObserver(() => l.current(u))
      i.observe(u), a.add(() => i.disconnect())
    }
    return () => a.dispose()
  }, [t, l, e])
}
let Li = [
    '[contentEditable=true]',
    '[tabindex]',
    'a[href]',
    'area[href]',
    'button:not([disabled])',
    'iframe',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])'
  ]
    .map(e => `${e}:not([tabindex='-1'])`)
    .join(','),
  Yb = ['[data-autofocus]'].map(e => `${e}:not([tabindex='-1'])`).join(',')
var bt = (e => (
    (e[(e.First = 1)] = 'First'),
    (e[(e.Previous = 2)] = 'Previous'),
    (e[(e.Next = 4)] = 'Next'),
    (e[(e.Last = 8)] = 'Last'),
    (e[(e.WrapAround = 16)] = 'WrapAround'),
    (e[(e.NoScroll = 32)] = 'NoScroll'),
    (e[(e.AutoFocus = 64)] = 'AutoFocus'),
    e
  ))(bt || {}),
  ff = (e => (
    (e[(e.Error = 0)] = 'Error'),
    (e[(e.Overflow = 1)] = 'Overflow'),
    (e[(e.Success = 2)] = 'Success'),
    (e[(e.Underflow = 3)] = 'Underflow'),
    e
  ))(ff || {}),
  Gb = (e => ((e[(e.Previous = -1)] = 'Previous'), (e[(e.Next = 1)] = 'Next'), e))(Gb || {})
function Kg(e = document.body) {
  return e == null
    ? []
    : Array.from(e.querySelectorAll(Li)).sort((t, n) =>
        Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER))
      )
}
function Xb(e = document.body) {
  return e == null
    ? []
    : Array.from(e.querySelectorAll(Yb)).sort((t, n) =>
        Math.sign((t.tabIndex || Number.MAX_SAFE_INTEGER) - (n.tabIndex || Number.MAX_SAFE_INTEGER))
      )
}
var po = (e => ((e[(e.Strict = 0)] = 'Strict'), (e[(e.Loose = 1)] = 'Loose'), e))(po || {})
function Jg(e, t = 0) {
  var n
  return e === ((n = iu(e)) == null ? void 0 : n.body)
    ? !1
    : ke(t, {
        0() {
          return e.matches(Li)
        },
        1() {
          let l = e
          for (; l !== null; ) {
            if (l.matches(Li)) return !0
            l = l.parentElement
          }
          return !1
        }
      })
}
var Qb = (e => ((e[(e.Keyboard = 0)] = 'Keyboard'), (e[(e.Mouse = 1)] = 'Mouse'), e))(Qb || {})
typeof window < 'u' &&
  typeof document < 'u' &&
  (document.addEventListener(
    'keydown',
    e => {
      e.metaKey ||
        e.altKey ||
        e.ctrlKey ||
        (document.documentElement.dataset.headlessuiFocusVisible = '')
    },
    !0
  ),
  document.addEventListener(
    'click',
    e => {
      e.detail === 1
        ? delete document.documentElement.dataset.headlessuiFocusVisible
        : e.detail === 0 && (document.documentElement.dataset.headlessuiFocusVisible = '')
    },
    !0
  ))
function Ft(e) {
  e == null || e.focus({ preventScroll: !0 })
}
let Vb = ['textarea', 'input'].join(',')
function Zb(e) {
  var t, n
  return (n = (t = e == null ? void 0 : e.matches) == null ? void 0 : t.call(e, Vb)) != null
    ? n
    : !1
}
function Wg(e, t = n => n) {
  return e.slice().sort((n, l) => {
    let u = t(n),
      a = t(l)
    if (u === null || a === null) return 0
    let i = u.compareDocumentPosition(a)
    return i & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : i & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0
  })
}
function kb(e, t) {
  return Bl(Kg(), t, { relativeTo: e })
}
function Bl(e, t, { sorted: n = !0, relativeTo: l = null, skipElements: u = [] } = {}) {
  let a = Array.isArray(e) ? (e.length > 0 ? e[0].ownerDocument : document) : e.ownerDocument,
    i = Array.isArray(e) ? (n ? Wg(e) : e) : t & 64 ? Xb(e) : Kg(e)
  u.length > 0 &&
    i.length > 1 &&
    (i = i.filter(
      s =>
        !u.some(y =>
          y != null && 'current' in y ? (y == null ? void 0 : y.current) === s : y === s
        )
    )),
    (l = l ?? a.activeElement)
  let r = (() => {
      if (t & 5) return 1
      if (t & 10) return -1
      throw new Error('Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last')
    })(),
    c = (() => {
      if (t & 1) return 0
      if (t & 2) return Math.max(0, i.indexOf(l)) - 1
      if (t & 4) return Math.max(0, i.indexOf(l)) + 1
      if (t & 8) return i.length - 1
      throw new Error('Missing Focus.First, Focus.Previous, Focus.Next or Focus.Last')
    })(),
    f = t & 32 ? { preventScroll: !0 } : {},
    o = 0,
    g = i.length,
    m
  do {
    if (o >= g || o + g <= 0) return 0
    let s = c + o
    if (t & 16) s = (s + g) % g
    else {
      if (s < 0) return 3
      if (s >= g) return 1
    }
    ;(m = i[s]), m == null || m.focus(f), (o += r)
  } while (m !== a.activeElement)
  return t & 6 && Zb(m) && m.select(), 2
}
function Pg() {
  return (
    /iPhone/gi.test(window.navigator.platform) ||
    (/Mac/gi.test(window.navigator.platform) && window.navigator.maxTouchPoints > 0)
  )
}
function Fb() {
  return /Android/gi.test(window.navigator.userAgent)
}
function Kb() {
  return Pg() || Fb()
}
function Eu(e, t, n, l) {
  let u = zn(n)
  d.useEffect(() => {
    if (!e) return
    function a(i) {
      u.current(i)
    }
    return document.addEventListener(t, a, l), () => document.removeEventListener(t, a, l)
  }, [e, t, l])
}
function Ig(e, t, n, l) {
  let u = zn(n)
  d.useEffect(() => {
    if (!e) return
    function a(i) {
      u.current(i)
    }
    return window.addEventListener(t, a, l), () => window.removeEventListener(t, a, l)
  }, [e, t, l])
}
const ed = 30
function ev(e, t, n) {
  let l = ru(e, 'outside-click'),
    u = zn(n),
    a = d.useCallback(
      function (c, f) {
        if (c.defaultPrevented) return
        let o = f(c)
        if (o === null || !o.getRootNode().contains(o) || !o.isConnected) return
        let g = (function m(s) {
          return typeof s == 'function' ? m(s()) : Array.isArray(s) || s instanceof Set ? s : [s]
        })(t)
        for (let m of g)
          if (m !== null && (m.contains(o) || (c.composed && c.composedPath().includes(m)))) return
        return !Jg(o, po.Loose) && o.tabIndex !== -1 && c.preventDefault(), u.current(c, o)
      },
      [u, t]
    ),
    i = d.useRef(null)
  Eu(
    l,
    'pointerdown',
    c => {
      var f, o
      i.current =
        ((o = (f = c.composedPath) == null ? void 0 : f.call(c)) == null ? void 0 : o[0]) ||
        c.target
    },
    !0
  ),
    Eu(
      l,
      'mousedown',
      c => {
        var f, o
        i.current =
          ((o = (f = c.composedPath) == null ? void 0 : f.call(c)) == null ? void 0 : o[0]) ||
          c.target
      },
      !0
    ),
    Eu(
      l,
      'click',
      c => {
        Kb() || (i.current && (a(c, () => i.current), (i.current = null)))
      },
      !0
    )
  let r = d.useRef({ x: 0, y: 0 })
  Eu(
    l,
    'touchstart',
    c => {
      ;(r.current.x = c.touches[0].clientX), (r.current.y = c.touches[0].clientY)
    },
    !0
  ),
    Eu(
      l,
      'touchend',
      c => {
        let f = { x: c.changedTouches[0].clientX, y: c.changedTouches[0].clientY }
        if (!(Math.abs(f.x - r.current.x) >= ed || Math.abs(f.y - r.current.y) >= ed))
          return a(c, () => (c.target instanceof HTMLElement ? c.target : null))
      },
      !0
    ),
    Ig(
      l,
      'blur',
      c =>
        a(c, () =>
          window.document.activeElement instanceof HTMLIFrameElement
            ? window.document.activeElement
            : null
        ),
      !0
    )
}
function cu(...e) {
  return d.useMemo(() => iu(...e), [...e])
}
function tv(e, t, n, l) {
  let u = zn(n)
  d.useEffect(() => {
    e = e ?? window
    function a(i) {
      u.current(i)
    }
    return e.addEventListener(t, a, l), () => e.removeEventListener(t, a, l)
  }, [e, t, l])
}
function nv(e, t) {
  return d.useMemo(() => {
    var n
    if (e.type) return e.type
    let l = (n = e.as) != null ? n : 'button'
    if (
      (typeof l == 'string' && l.toLowerCase() === 'button') ||
      ((t == null ? void 0 : t.tagName) === 'BUTTON' && !t.hasAttribute('type'))
    )
      return 'button'
  }, [e.type, e.as, t])
}
function Jb() {
  let e
  return {
    before({ doc: t }) {
      var n
      let l = t.documentElement,
        u = (n = t.defaultView) != null ? n : window
      e = Math.max(0, u.innerWidth - l.clientWidth)
    },
    after({ doc: t, d: n }) {
      let l = t.documentElement,
        u = Math.max(0, l.clientWidth - l.offsetWidth),
        a = Math.max(0, e - u)
      n.style(l, 'paddingRight', `${a}px`)
    }
  }
}
function Wb() {
  return Pg()
    ? {
        before({ doc: e, d: t, meta: n }) {
          function l(u) {
            return n.containers.flatMap(a => a()).some(a => a.contains(u))
          }
          t.microTask(() => {
            var u
            if (window.getComputedStyle(e.documentElement).scrollBehavior !== 'auto') {
              let r = en()
              r.style(e.documentElement, 'scrollBehavior', 'auto'),
                t.add(() => t.microTask(() => r.dispose()))
            }
            let a = (u = window.scrollY) != null ? u : window.pageYOffset,
              i = null
            t.addEventListener(
              e,
              'click',
              r => {
                if (r.target instanceof HTMLElement)
                  try {
                    let c = r.target.closest('a')
                    if (!c) return
                    let { hash: f } = new URL(c.href),
                      o = e.querySelector(f)
                    o && !l(o) && (i = o)
                  } catch {}
              },
              !0
            ),
              t.addEventListener(e, 'touchstart', r => {
                if (r.target instanceof HTMLElement)
                  if (l(r.target)) {
                    let c = r.target
                    for (; c.parentElement && l(c.parentElement); ) c = c.parentElement
                    t.style(c, 'overscrollBehavior', 'contain')
                  } else t.style(r.target, 'touchAction', 'none')
              }),
              t.addEventListener(
                e,
                'touchmove',
                r => {
                  if (r.target instanceof HTMLElement) {
                    if (r.target.tagName === 'INPUT') return
                    if (l(r.target)) {
                      let c = r.target
                      for (
                        ;
                        c.parentElement &&
                        c.dataset.headlessuiPortal !== '' &&
                        !(c.scrollHeight > c.clientHeight || c.scrollWidth > c.clientWidth);

                      )
                        c = c.parentElement
                      c.dataset.headlessuiPortal === '' && r.preventDefault()
                    } else r.preventDefault()
                  }
                },
                { passive: !1 }
              ),
              t.add(() => {
                var r
                let c = (r = window.scrollY) != null ? r : window.pageYOffset
                a !== c && window.scrollTo(0, a),
                  i && i.isConnected && (i.scrollIntoView({ block: 'nearest' }), (i = null))
              })
          })
        }
      }
    : {}
}
function Pb() {
  return {
    before({ doc: e, d: t }) {
      t.style(e.documentElement, 'overflow', 'hidden')
    }
  }
}
function Ib(e) {
  let t = {}
  for (let n of e) Object.assign(t, n(t))
  return t
}
let Qn = Vg(() => new Map(), {
  PUSH(e, t) {
    var n
    let l = (n = this.get(e)) != null ? n : { doc: e, count: 0, d: en(), meta: new Set() }
    return l.count++, l.meta.add(t), this.set(e, l), this
  },
  POP(e, t) {
    let n = this.get(e)
    return n && (n.count--, n.meta.delete(t)), this
  },
  SCROLL_PREVENT({ doc: e, d: t, meta: n }) {
    let l = { doc: e, d: t, meta: Ib(n) },
      u = [Wb(), Jb(), Pb()]
    u.forEach(({ before: a }) => (a == null ? void 0 : a(l))),
      u.forEach(({ after: a }) => (a == null ? void 0 : a(l)))
  },
  SCROLL_ALLOW({ d: e }) {
    e.dispose()
  },
  TEARDOWN({ doc: e }) {
    this.delete(e)
  }
})
Qn.subscribe(() => {
  let e = Qn.getSnapshot(),
    t = new Map()
  for (let [n] of e) t.set(n, n.documentElement.style.overflow)
  for (let n of e.values()) {
    let l = t.get(n.doc) === 'hidden',
      u = n.count !== 0
    ;((u && !l) || (!u && l)) && Qn.dispatch(n.count > 0 ? 'SCROLL_PREVENT' : 'SCROLL_ALLOW', n),
      n.count === 0 && Qn.dispatch('TEARDOWN', n)
  }
})
function e1(e, t, n = () => ({ containers: [] })) {
  let l = Zg(Qn),
    u = t ? l.get(t) : void 0,
    a = u ? u.count > 0 : !1
  return (
    le(() => {
      if (!(!t || !e)) return Qn.dispatch('PUSH', t, n), () => Qn.dispatch('POP', t, n)
    }, [e, t]),
    a
  )
}
function lv(e, t, n = () => [document.body]) {
  let l = ru(e, 'scroll-lock')
  e1(l, t, u => {
    var a
    return { containers: [...((a = u.containers) != null ? a : []), n] }
  })
}
function td(e) {
  return [e.screenX, e.screenY]
}
function t1() {
  let e = d.useRef([-1, -1])
  return {
    wasMoved(t) {
      let n = td(t)
      return e.current[0] === n[0] && e.current[1] === n[1] ? !1 : ((e.current = n), !0)
    },
    update(t) {
      e.current = td(t)
    }
  }
}
function n1(e = 0) {
  let [t, n] = d.useState(e),
    l = d.useCallback(c => n(c), [t]),
    u = d.useCallback(c => n(f => f | c), [t]),
    a = d.useCallback(c => (t & c) === c, [t]),
    i = d.useCallback(c => n(f => f & ~c), [n]),
    r = d.useCallback(c => n(f => f ^ c), [n])
  return { flags: t, setFlag: l, addFlag: u, hasFlag: a, removeFlag: i, toggleFlag: r }
}
var l1 = {},
  nd,
  ld
typeof process < 'u' &&
  typeof globalThis < 'u' &&
  typeof Element < 'u' &&
  ((nd = process == null ? void 0 : l1) == null ? void 0 : nd.NODE_ENV) === 'test' &&
  typeof ((ld = Element == null ? void 0 : Element.prototype) == null ? void 0 : ld.getAnimations) >
    'u' &&
  (Element.prototype.getAnimations = function () {
    return []
  })
var u1 = (e => (
  (e[(e.None = 0)] = 'None'),
  (e[(e.Closed = 1)] = 'Closed'),
  (e[(e.Enter = 2)] = 'Enter'),
  (e[(e.Leave = 4)] = 'Leave'),
  e
))(u1 || {})
function uv(e) {
  let t = {}
  for (let n in e) e[n] === !0 && (t[`data-${n}`] = '')
  return t
}
function av(e, t, n, l) {
  let [u, a] = d.useState(n),
    { hasFlag: i, addFlag: r, removeFlag: c } = n1(e && u ? 3 : 0),
    f = d.useRef(!1),
    o = d.useRef(!1),
    g = tn()
  return (
    le(() => {
      var m
      if (e) {
        if ((n && a(!0), !t)) {
          n && r(3)
          return
        }
        return (
          (m = l == null ? void 0 : l.start) == null || m.call(l, n),
          a1(t, {
            inFlight: f,
            prepare() {
              o.current ? (o.current = !1) : (o.current = f.current),
                (f.current = !0),
                !o.current && (n ? (r(3), c(4)) : (r(4), c(2)))
            },
            run() {
              o.current ? (n ? (c(3), r(4)) : (c(4), r(3))) : n ? c(1) : r(1)
            },
            done() {
              var s
              ;(o.current &&
                typeof t.getAnimations == 'function' &&
                t.getAnimations().length > 0) ||
                ((f.current = !1),
                c(7),
                n || a(!1),
                (s = l == null ? void 0 : l.end) == null || s.call(l, n))
            }
          })
        )
      }
    }, [e, n, t, g]),
    e
      ? [u, { closed: i(1), enter: i(2), leave: i(4), transition: i(2) || i(4) }]
      : [n, { closed: void 0, enter: void 0, leave: void 0, transition: void 0 }]
  )
}
function a1(e, { prepare: t, run: n, done: l, inFlight: u }) {
  let a = en()
  return (
    r1(e, { prepare: t, inFlight: u }),
    a.nextFrame(() => {
      n(),
        a.requestAnimationFrame(() => {
          a.add(i1(e, l))
        })
    }),
    a.dispose
  )
}
function i1(e, t) {
  var n, l
  let u = en()
  if (!e) return u.dispose
  let a = !1
  u.add(() => {
    a = !0
  })
  let i =
    (l =
      (n = e.getAnimations) == null ? void 0 : n.call(e).filter(r => r instanceof CSSTransition)) !=
    null
      ? l
      : []
  return i.length === 0
    ? (t(), u.dispose)
    : (Promise.allSettled(i.map(r => r.finished)).then(() => {
        a || t()
      }),
      u.dispose)
}
function r1(e, { inFlight: t, prepare: n }) {
  if (t != null && t.current) {
    n()
    return
  }
  let l = e.style.transition
  ;(e.style.transition = 'none'), n(), e.offsetHeight, (e.style.transition = l)
}
function yo(e, t) {
  let n = d.useRef([]),
    l = j(e)
  d.useEffect(() => {
    let u = [...n.current]
    for (let [a, i] of t.entries())
      if (n.current[a] !== i) {
        let r = l(t, u)
        return (n.current = t), r
      }
  }, [l, ...t])
}
function ir() {
  return typeof window < 'u'
}
function fu(e) {
  return iv(e) ? (e.nodeName || '').toLowerCase() : '#document'
}
function nt(e) {
  var t
  return (e == null || (t = e.ownerDocument) == null ? void 0 : t.defaultView) || window
}
function Ht(e) {
  var t
  return (t = (iv(e) ? e.ownerDocument : e.document) || window.document) == null
    ? void 0
    : t.documentElement
}
function iv(e) {
  return ir() ? e instanceof Node || e instanceof nt(e).Node : !1
}
function Ye(e) {
  return ir() ? e instanceof Element || e instanceof nt(e).Element : !1
}
function Ct(e) {
  return ir() ? e instanceof HTMLElement || e instanceof nt(e).HTMLElement : !1
}
function ud(e) {
  return !ir() || typeof ShadowRoot > 'u'
    ? !1
    : e instanceof ShadowRoot || e instanceof nt(e).ShadowRoot
}
function Ta(e) {
  const { overflow: t, overflowX: n, overflowY: l, display: u } = St(e)
  return /auto|scroll|overlay|hidden|clip/.test(t + l + n) && !['inline', 'contents'].includes(u)
}
function c1(e) {
  return ['table', 'td', 'th'].includes(fu(e))
}
function rr(e) {
  return [':popover-open', ':modal'].some(t => {
    try {
      return e.matches(t)
    } catch {
      return !1
    }
  })
}
function bo(e) {
  const t = Eo(),
    n = Ye(e) ? St(e) : e
  return (
    ['transform', 'translate', 'scale', 'rotate', 'perspective'].some(l =>
      n[l] ? n[l] !== 'none' : !1
    ) ||
    (n.containerType ? n.containerType !== 'normal' : !1) ||
    (!t && (n.backdropFilter ? n.backdropFilter !== 'none' : !1)) ||
    (!t && (n.filter ? n.filter !== 'none' : !1)) ||
    ['transform', 'translate', 'scale', 'rotate', 'perspective', 'filter'].some(l =>
      (n.willChange || '').includes(l)
    ) ||
    ['paint', 'layout', 'strict', 'content'].some(l => (n.contain || '').includes(l))
  )
}
function f1(e) {
  let t = Dn(e)
  for (; Ct(t) && !Pl(t); ) {
    if (bo(t)) return t
    if (rr(t)) return null
    t = Dn(t)
  }
  return null
}
function Eo() {
  return typeof CSS > 'u' || !CSS.supports ? !1 : CSS.supports('-webkit-backdrop-filter', 'none')
}
function Pl(e) {
  return ['html', 'body', '#document'].includes(fu(e))
}
function St(e) {
  return nt(e).getComputedStyle(e)
}
function cr(e) {
  return Ye(e)
    ? { scrollLeft: e.scrollLeft, scrollTop: e.scrollTop }
    : { scrollLeft: e.scrollX, scrollTop: e.scrollY }
}
function Dn(e) {
  if (fu(e) === 'html') return e
  const t = e.assignedSlot || e.parentNode || (ud(e) && e.host) || Ht(e)
  return ud(t) ? t.host : t
}
function rv(e) {
  const t = Dn(e)
  return Pl(t) ? (e.ownerDocument ? e.ownerDocument.body : e.body) : Ct(t) && Ta(t) ? t : rv(t)
}
function ra(e, t, n) {
  var l
  t === void 0 && (t = []), n === void 0 && (n = !0)
  const u = rv(e),
    a = u === ((l = e.ownerDocument) == null ? void 0 : l.body),
    i = nt(u)
  if (a) {
    const r = of(i)
    return t.concat(i, i.visualViewport || [], Ta(u) ? u : [], r && n ? ra(r) : [])
  }
  return t.concat(u, ra(u, [], n))
}
function of(e) {
  return e.parent && Object.getPrototypeOf(e.parent) ? e.frameElement : null
}
function o1() {
  const e = navigator.userAgentData
  return e && Array.isArray(e.brands)
    ? e.brands
        .map(t => {
          let { brand: n, version: l } = t
          return n + '/' + l
        })
        .join(' ')
    : navigator.userAgent
}
const ul = Math.min,
  Ue = Math.max,
  ca = Math.round,
  Va = Math.floor,
  Dt = e => ({ x: e, y: e }),
  s1 = { left: 'right', right: 'left', bottom: 'top', top: 'bottom' },
  d1 = { start: 'end', end: 'start' }
function ad(e, t, n) {
  return Ue(e, ul(t, n))
}
function ou(e, t) {
  return typeof e == 'function' ? e(t) : e
}
function _n(e) {
  return e.split('-')[0]
}
function Oa(e) {
  return e.split('-')[1]
}
function cv(e) {
  return e === 'x' ? 'y' : 'x'
}
function fv(e) {
  return e === 'y' ? 'height' : 'width'
}
function al(e) {
  return ['top', 'bottom'].includes(_n(e)) ? 'y' : 'x'
}
function ov(e) {
  return cv(al(e))
}
function m1(e, t, n) {
  n === void 0 && (n = !1)
  const l = Oa(e),
    u = ov(e),
    a = fv(u)
  let i =
    u === 'x' ? (l === (n ? 'end' : 'start') ? 'right' : 'left') : l === 'start' ? 'bottom' : 'top'
  return t.reference[a] > t.floating[a] && (i = Ui(i)), [i, Ui(i)]
}
function h1(e) {
  const t = Ui(e)
  return [sf(e), t, sf(t)]
}
function sf(e) {
  return e.replace(/start|end/g, t => d1[t])
}
function g1(e, t, n) {
  const l = ['left', 'right'],
    u = ['right', 'left'],
    a = ['top', 'bottom'],
    i = ['bottom', 'top']
  switch (e) {
    case 'top':
    case 'bottom':
      return n ? (t ? u : l) : t ? l : u
    case 'left':
    case 'right':
      return t ? a : i
    default:
      return []
  }
}
function v1(e, t, n, l) {
  const u = Oa(e)
  let a = g1(_n(e), n === 'start', l)
  return u && ((a = a.map(i => i + '-' + u)), t && (a = a.concat(a.map(sf)))), a
}
function Ui(e) {
  return e.replace(/left|right|bottom|top/g, t => s1[t])
}
function p1(e) {
  return { top: 0, right: 0, bottom: 0, left: 0, ...e }
}
function y1(e) {
  return typeof e != 'number' ? p1(e) : { top: e, right: e, bottom: e, left: e }
}
function ji(e) {
  const { x: t, y: n, width: l, height: u } = e
  return { width: l, height: u, top: n, left: t, right: t + l, bottom: n + u, x: t, y: n }
}
function id(e, t, n) {
  let { reference: l, floating: u } = e
  const a = al(t),
    i = ov(t),
    r = fv(i),
    c = _n(t),
    f = a === 'y',
    o = l.x + l.width / 2 - u.width / 2,
    g = l.y + l.height / 2 - u.height / 2,
    m = l[r] / 2 - u[r] / 2
  let s
  switch (c) {
    case 'top':
      s = { x: o, y: l.y - u.height }
      break
    case 'bottom':
      s = { x: o, y: l.y + l.height }
      break
    case 'right':
      s = { x: l.x + l.width, y: g }
      break
    case 'left':
      s = { x: l.x - u.width, y: g }
      break
    default:
      s = { x: l.x, y: l.y }
  }
  switch (Oa(t)) {
    case 'start':
      s[i] -= m * (n && f ? -1 : 1)
      break
    case 'end':
      s[i] += m * (n && f ? -1 : 1)
      break
  }
  return s
}
const b1 = async (e, t, n) => {
  const { placement: l = 'bottom', strategy: u = 'absolute', middleware: a = [], platform: i } = n,
    r = a.filter(Boolean),
    c = await (i.isRTL == null ? void 0 : i.isRTL(t))
  let f = await i.getElementRects({ reference: e, floating: t, strategy: u }),
    { x: o, y: g } = id(f, l, c),
    m = l,
    s = {},
    y = 0
  for (let E = 0; E < r.length; E++) {
    const { name: x, fn: v } = r[E],
      {
        x: h,
        y: p,
        data: b,
        reset: S
      } = await v({
        x: o,
        y: g,
        initialPlacement: l,
        placement: m,
        strategy: u,
        middlewareData: s,
        rects: f,
        platform: i,
        elements: { reference: e, floating: t }
      })
    ;(o = h ?? o),
      (g = p ?? g),
      (s = { ...s, [x]: { ...s[x], ...b } }),
      S &&
        y <= 50 &&
        (y++,
        typeof S == 'object' &&
          (S.placement && (m = S.placement),
          S.rects &&
            (f =
              S.rects === !0
                ? await i.getElementRects({ reference: e, floating: t, strategy: u })
                : S.rects),
          ({ x: o, y: g } = id(f, m, c))),
        (E = -1))
  }
  return { x: o, y: g, placement: m, strategy: u, middlewareData: s }
}
async function fr(e, t) {
  var n
  t === void 0 && (t = {})
  const { x: l, y: u, platform: a, rects: i, elements: r, strategy: c } = e,
    {
      boundary: f = 'clippingAncestors',
      rootBoundary: o = 'viewport',
      elementContext: g = 'floating',
      altBoundary: m = !1,
      padding: s = 0
    } = ou(t, e),
    y = y1(s),
    x = r[m ? (g === 'floating' ? 'reference' : 'floating') : g],
    v = ji(
      await a.getClippingRect({
        element:
          (n = await (a.isElement == null ? void 0 : a.isElement(x))) == null || n
            ? x
            : x.contextElement ||
              (await (a.getDocumentElement == null ? void 0 : a.getDocumentElement(r.floating))),
        boundary: f,
        rootBoundary: o,
        strategy: c
      })
    ),
    h =
      g === 'floating'
        ? { x: l, y: u, width: i.floating.width, height: i.floating.height }
        : i.reference,
    p = await (a.getOffsetParent == null ? void 0 : a.getOffsetParent(r.floating)),
    b = (await (a.isElement == null ? void 0 : a.isElement(p)))
      ? (await (a.getScale == null ? void 0 : a.getScale(p))) || { x: 1, y: 1 }
      : { x: 1, y: 1 },
    S = ji(
      a.convertOffsetParentRelativeRectToViewportRelativeRect
        ? await a.convertOffsetParentRelativeRectToViewportRelativeRect({
            elements: r,
            rect: h,
            offsetParent: p,
            strategy: c
          })
        : h
    )
  return {
    top: (v.top - S.top + y.top) / b.y,
    bottom: (S.bottom - v.bottom + y.bottom) / b.y,
    left: (v.left - S.left + y.left) / b.x,
    right: (S.right - v.right + y.right) / b.x
  }
}
const E1 = function (e) {
  return (
    e === void 0 && (e = {}),
    {
      name: 'flip',
      options: e,
      async fn(t) {
        var n, l
        const {
            placement: u,
            middlewareData: a,
            rects: i,
            initialPlacement: r,
            platform: c,
            elements: f
          } = t,
          {
            mainAxis: o = !0,
            crossAxis: g = !0,
            fallbackPlacements: m,
            fallbackStrategy: s = 'bestFit',
            fallbackAxisSideDirection: y = 'none',
            flipAlignment: E = !0,
            ...x
          } = ou(e, t)
        if ((n = a.arrow) != null && n.alignmentOffset) return {}
        const v = _n(u),
          h = al(r),
          p = _n(r) === r,
          b = await (c.isRTL == null ? void 0 : c.isRTL(f.floating)),
          S = m || (p || !E ? [Ui(r)] : h1(r)),
          A = y !== 'none'
        !m && A && S.push(...v1(r, E, y, b))
        const O = [r, ...S],
          M = await fr(t, x),
          z = []
        let _ = ((l = a.flip) == null ? void 0 : l.overflows) || []
        if ((o && z.push(M[v]), g)) {
          const V = m1(u, i, b)
          z.push(M[V[0]], M[V[1]])
        }
        if (((_ = [..._, { placement: u, overflows: z }]), !z.every(V => V <= 0))) {
          var D, k
          const V = (((D = a.flip) == null ? void 0 : D.index) || 0) + 1,
            ae = O[V]
          if (ae) return { data: { index: V, overflows: _ }, reset: { placement: ae } }
          let R =
            (k = _.filter(H => H.overflows[0] <= 0).sort(
              (H, C) => H.overflows[1] - C.overflows[1]
            )[0]) == null
              ? void 0
              : k.placement
          if (!R)
            switch (s) {
              case 'bestFit': {
                var K
                const H =
                  (K = _.filter(C => {
                    if (A) {
                      const L = al(C.placement)
                      return L === h || L === 'y'
                    }
                    return !0
                  })
                    .map(C => [
                      C.placement,
                      C.overflows.filter(L => L > 0).reduce((L, q) => L + q, 0)
                    ])
                    .sort((C, L) => C[1] - L[1])[0]) == null
                    ? void 0
                    : K[0]
                H && (R = H)
                break
              }
              case 'initialPlacement':
                R = r
                break
            }
          if (u !== R) return { reset: { placement: R } }
        }
        return {}
      }
    }
  )
}
async function S1(e, t) {
  const { placement: n, platform: l, elements: u } = e,
    a = await (l.isRTL == null ? void 0 : l.isRTL(u.floating)),
    i = _n(n),
    r = Oa(n),
    c = al(n) === 'y',
    f = ['left', 'top'].includes(i) ? -1 : 1,
    o = a && c ? -1 : 1,
    g = ou(t, e)
  let {
    mainAxis: m,
    crossAxis: s,
    alignmentAxis: y
  } = typeof g == 'number'
    ? { mainAxis: g, crossAxis: 0, alignmentAxis: null }
    : { mainAxis: g.mainAxis || 0, crossAxis: g.crossAxis || 0, alignmentAxis: g.alignmentAxis }
  return (
    r && typeof y == 'number' && (s = r === 'end' ? y * -1 : y),
    c ? { x: s * o, y: m * f } : { x: m * f, y: s * o }
  )
}
const x1 = function (e) {
    return (
      e === void 0 && (e = 0),
      {
        name: 'offset',
        options: e,
        async fn(t) {
          var n, l
          const { x: u, y: a, placement: i, middlewareData: r } = t,
            c = await S1(t, e)
          return i === ((n = r.offset) == null ? void 0 : n.placement) &&
            (l = r.arrow) != null &&
            l.alignmentOffset
            ? {}
            : { x: u + c.x, y: a + c.y, data: { ...c, placement: i } }
        }
      }
    )
  },
  T1 = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: 'shift',
        options: e,
        async fn(t) {
          const { x: n, y: l, placement: u } = t,
            {
              mainAxis: a = !0,
              crossAxis: i = !1,
              limiter: r = {
                fn: x => {
                  let { x: v, y: h } = x
                  return { x: v, y: h }
                }
              },
              ...c
            } = ou(e, t),
            f = { x: n, y: l },
            o = await fr(t, c),
            g = al(_n(u)),
            m = cv(g)
          let s = f[m],
            y = f[g]
          if (a) {
            const x = m === 'y' ? 'top' : 'left',
              v = m === 'y' ? 'bottom' : 'right',
              h = s + o[x],
              p = s - o[v]
            s = ad(h, s, p)
          }
          if (i) {
            const x = g === 'y' ? 'top' : 'left',
              v = g === 'y' ? 'bottom' : 'right',
              h = y + o[x],
              p = y - o[v]
            y = ad(h, y, p)
          }
          const E = r.fn({ ...t, [m]: s, [g]: y })
          return { ...E, data: { x: E.x - n, y: E.y - l, enabled: { [m]: a, [g]: i } } }
        }
      }
    )
  },
  O1 = function (e) {
    return (
      e === void 0 && (e = {}),
      {
        name: 'size',
        options: e,
        async fn(t) {
          var n, l
          const { placement: u, rects: a, platform: i, elements: r } = t,
            { apply: c = () => {}, ...f } = ou(e, t),
            o = await fr(t, f),
            g = _n(u),
            m = Oa(u),
            s = al(u) === 'y',
            { width: y, height: E } = a.floating
          let x, v
          g === 'top' || g === 'bottom'
            ? ((x = g),
              (v =
                m === ((await (i.isRTL == null ? void 0 : i.isRTL(r.floating))) ? 'start' : 'end')
                  ? 'left'
                  : 'right'))
            : ((v = g), (x = m === 'end' ? 'top' : 'bottom'))
          const h = E - o.top - o.bottom,
            p = y - o.left - o.right,
            b = ul(E - o[x], h),
            S = ul(y - o[v], p),
            A = !t.middlewareData.shift
          let O = b,
            M = S
          if (
            ((n = t.middlewareData.shift) != null && n.enabled.x && (M = p),
            (l = t.middlewareData.shift) != null && l.enabled.y && (O = h),
            A && !m)
          ) {
            const _ = Ue(o.left, 0),
              D = Ue(o.right, 0),
              k = Ue(o.top, 0),
              K = Ue(o.bottom, 0)
            s
              ? (M = y - 2 * (_ !== 0 || D !== 0 ? _ + D : Ue(o.left, o.right)))
              : (O = E - 2 * (k !== 0 || K !== 0 ? k + K : Ue(o.top, o.bottom)))
          }
          await c({ ...t, availableWidth: M, availableHeight: O })
          const z = await i.getDimensions(r.floating)
          return y !== z.width || E !== z.height ? { reset: { rects: !0 } } : {}
        }
      }
    )
  }
function sv(e) {
  const t = St(e)
  let n = parseFloat(t.width) || 0,
    l = parseFloat(t.height) || 0
  const u = Ct(e),
    a = u ? e.offsetWidth : n,
    i = u ? e.offsetHeight : l,
    r = ca(n) !== a || ca(l) !== i
  return r && ((n = a), (l = i)), { width: n, height: l, $: r }
}
function So(e) {
  return Ye(e) ? e : e.contextElement
}
function $l(e) {
  const t = So(e)
  if (!Ct(t)) return Dt(1)
  const n = t.getBoundingClientRect(),
    { width: l, height: u, $: a } = sv(t)
  let i = (a ? ca(n.width) : n.width) / l,
    r = (a ? ca(n.height) : n.height) / u
  return (
    (!i || !Number.isFinite(i)) && (i = 1), (!r || !Number.isFinite(r)) && (r = 1), { x: i, y: r }
  )
}
const w1 = Dt(0)
function dv(e) {
  const t = nt(e)
  return !Eo() || !t.visualViewport
    ? w1
    : { x: t.visualViewport.offsetLeft, y: t.visualViewport.offsetTop }
}
function A1(e, t, n) {
  return t === void 0 && (t = !1), !n || (t && n !== nt(e)) ? !1 : t
}
function il(e, t, n, l) {
  t === void 0 && (t = !1), n === void 0 && (n = !1)
  const u = e.getBoundingClientRect(),
    a = So(e)
  let i = Dt(1)
  t && (l ? Ye(l) && (i = $l(l)) : (i = $l(e)))
  const r = A1(a, n, l) ? dv(a) : Dt(0)
  let c = (u.left + r.x) / i.x,
    f = (u.top + r.y) / i.y,
    o = u.width / i.x,
    g = u.height / i.y
  if (a) {
    const m = nt(a),
      s = l && Ye(l) ? nt(l) : l
    let y = m,
      E = of(y)
    for (; E && l && s !== y; ) {
      const x = $l(E),
        v = E.getBoundingClientRect(),
        h = St(E),
        p = v.left + (E.clientLeft + parseFloat(h.paddingLeft)) * x.x,
        b = v.top + (E.clientTop + parseFloat(h.paddingTop)) * x.y
      ;(c *= x.x), (f *= x.y), (o *= x.x), (g *= x.y), (c += p), (f += b), (y = nt(E)), (E = of(y))
    }
  }
  return ji({ width: o, height: g, x: c, y: f })
}
function xo(e, t) {
  const n = cr(e).scrollLeft
  return t ? t.left + n : il(Ht(e)).left + n
}
function mv(e, t, n) {
  n === void 0 && (n = !1)
  const l = e.getBoundingClientRect(),
    u = l.left + t.scrollLeft - (n ? 0 : xo(e, l)),
    a = l.top + t.scrollTop
  return { x: u, y: a }
}
function R1(e) {
  let { elements: t, rect: n, offsetParent: l, strategy: u } = e
  const a = u === 'fixed',
    i = Ht(l),
    r = t ? rr(t.floating) : !1
  if (l === i || (r && a)) return n
  let c = { scrollLeft: 0, scrollTop: 0 },
    f = Dt(1)
  const o = Dt(0),
    g = Ct(l)
  if ((g || (!g && !a)) && ((fu(l) !== 'body' || Ta(i)) && (c = cr(l)), Ct(l))) {
    const s = il(l)
    ;(f = $l(l)), (o.x = s.x + l.clientLeft), (o.y = s.y + l.clientTop)
  }
  const m = i && !g && !a ? mv(i, c, !0) : Dt(0)
  return {
    width: n.width * f.x,
    height: n.height * f.y,
    x: n.x * f.x - c.scrollLeft * f.x + o.x + m.x,
    y: n.y * f.y - c.scrollTop * f.y + o.y + m.y
  }
}
function M1(e) {
  return Array.from(e.getClientRects())
}
function D1(e) {
  const t = Ht(e),
    n = cr(e),
    l = e.ownerDocument.body,
    u = Ue(t.scrollWidth, t.clientWidth, l.scrollWidth, l.clientWidth),
    a = Ue(t.scrollHeight, t.clientHeight, l.scrollHeight, l.clientHeight)
  let i = -n.scrollLeft + xo(e)
  const r = -n.scrollTop
  return (
    St(l).direction === 'rtl' && (i += Ue(t.clientWidth, l.clientWidth) - u),
    { width: u, height: a, x: i, y: r }
  )
}
function _1(e, t) {
  const n = nt(e),
    l = Ht(e),
    u = n.visualViewport
  let a = l.clientWidth,
    i = l.clientHeight,
    r = 0,
    c = 0
  if (u) {
    ;(a = u.width), (i = u.height)
    const f = Eo()
    ;(!f || (f && t === 'fixed')) && ((r = u.offsetLeft), (c = u.offsetTop))
  }
  return { width: a, height: i, x: r, y: c }
}
function C1(e, t) {
  const n = il(e, !0, t === 'fixed'),
    l = n.top + e.clientTop,
    u = n.left + e.clientLeft,
    a = Ct(e) ? $l(e) : Dt(1),
    i = e.clientWidth * a.x,
    r = e.clientHeight * a.y,
    c = u * a.x,
    f = l * a.y
  return { width: i, height: r, x: c, y: f }
}
function rd(e, t, n) {
  let l
  if (t === 'viewport') l = _1(e, n)
  else if (t === 'document') l = D1(Ht(e))
  else if (Ye(t)) l = C1(t, n)
  else {
    const u = dv(e)
    l = { x: t.x - u.x, y: t.y - u.y, width: t.width, height: t.height }
  }
  return ji(l)
}
function hv(e, t) {
  const n = Dn(e)
  return n === t || !Ye(n) || Pl(n) ? !1 : St(n).position === 'fixed' || hv(n, t)
}
function N1(e, t) {
  const n = t.get(e)
  if (n) return n
  let l = ra(e, [], !1).filter(r => Ye(r) && fu(r) !== 'body'),
    u = null
  const a = St(e).position === 'fixed'
  let i = a ? Dn(e) : e
  for (; Ye(i) && !Pl(i); ) {
    const r = St(i),
      c = bo(i)
    !c && r.position === 'fixed' && (u = null),
      (
        a
          ? !c && !u
          : (!c && r.position === 'static' && !!u && ['absolute', 'fixed'].includes(u.position)) ||
            (Ta(i) && !c && hv(e, i))
      )
        ? (l = l.filter(o => o !== i))
        : (u = r),
      (i = Dn(i))
  }
  return t.set(e, l), l
}
function z1(e) {
  let { element: t, boundary: n, rootBoundary: l, strategy: u } = e
  const i = [...(n === 'clippingAncestors' ? (rr(t) ? [] : N1(t, this._c)) : [].concat(n)), l],
    r = i[0],
    c = i.reduce((f, o) => {
      const g = rd(t, o, u)
      return (
        (f.top = Ue(g.top, f.top)),
        (f.right = ul(g.right, f.right)),
        (f.bottom = ul(g.bottom, f.bottom)),
        (f.left = Ue(g.left, f.left)),
        f
      )
    }, rd(t, r, u))
  return { width: c.right - c.left, height: c.bottom - c.top, x: c.left, y: c.top }
}
function H1(e) {
  const { width: t, height: n } = sv(e)
  return { width: t, height: n }
}
function L1(e, t, n) {
  const l = Ct(t),
    u = Ht(t),
    a = n === 'fixed',
    i = il(e, !0, a, t)
  let r = { scrollLeft: 0, scrollTop: 0 }
  const c = Dt(0)
  if (l || (!l && !a))
    if (((fu(t) !== 'body' || Ta(u)) && (r = cr(t)), l)) {
      const m = il(t, !0, a, t)
      ;(c.x = m.x + t.clientLeft), (c.y = m.y + t.clientTop)
    } else u && (c.x = xo(u))
  const f = u && !l && !a ? mv(u, r) : Dt(0),
    o = i.left + r.scrollLeft - c.x - f.x,
    g = i.top + r.scrollTop - c.y - f.y
  return { x: o, y: g, width: i.width, height: i.height }
}
function tc(e) {
  return St(e).position === 'static'
}
function cd(e, t) {
  if (!Ct(e) || St(e).position === 'fixed') return null
  if (t) return t(e)
  let n = e.offsetParent
  return Ht(e) === n && (n = n.ownerDocument.body), n
}
function gv(e, t) {
  const n = nt(e)
  if (rr(e)) return n
  if (!Ct(e)) {
    let u = Dn(e)
    for (; u && !Pl(u); ) {
      if (Ye(u) && !tc(u)) return u
      u = Dn(u)
    }
    return n
  }
  let l = cd(e, t)
  for (; l && c1(l) && tc(l); ) l = cd(l, t)
  return l && Pl(l) && tc(l) && !bo(l) ? n : l || f1(e) || n
}
const U1 = async function (e) {
  const t = this.getOffsetParent || gv,
    n = this.getDimensions,
    l = await n(e.floating)
  return {
    reference: L1(e.reference, await t(e.floating), e.strategy),
    floating: { x: 0, y: 0, width: l.width, height: l.height }
  }
}
function j1(e) {
  return St(e).direction === 'rtl'
}
const q1 = {
  convertOffsetParentRelativeRectToViewportRelativeRect: R1,
  getDocumentElement: Ht,
  getClippingRect: z1,
  getOffsetParent: gv,
  getElementRects: U1,
  getClientRects: M1,
  getDimensions: H1,
  getScale: $l,
  isElement: Ye,
  isRTL: j1
}
function vv(e, t) {
  return e.x === t.x && e.y === t.y && e.width === t.width && e.height === t.height
}
function B1(e, t) {
  let n = null,
    l
  const u = Ht(e)
  function a() {
    var r
    clearTimeout(l), (r = n) == null || r.disconnect(), (n = null)
  }
  function i(r, c) {
    r === void 0 && (r = !1), c === void 0 && (c = 1), a()
    const f = e.getBoundingClientRect(),
      { left: o, top: g, width: m, height: s } = f
    if ((r || t(), !m || !s)) return
    const y = Va(g),
      E = Va(u.clientWidth - (o + m)),
      x = Va(u.clientHeight - (g + s)),
      v = Va(o),
      p = {
        rootMargin: -y + 'px ' + -E + 'px ' + -x + 'px ' + -v + 'px',
        threshold: Ue(0, ul(1, c)) || 1
      }
    let b = !0
    function S(A) {
      const O = A[0].intersectionRatio
      if (O !== c) {
        if (!b) return i()
        O
          ? i(!1, O)
          : (l = setTimeout(() => {
              i(!1, 1e-7)
            }, 1e3))
      }
      O === 1 && !vv(f, e.getBoundingClientRect()) && i(), (b = !1)
    }
    try {
      n = new IntersectionObserver(S, { ...p, root: u.ownerDocument })
    } catch {
      n = new IntersectionObserver(S, p)
    }
    n.observe(e)
  }
  return i(!0), a
}
function $1(e, t, n, l) {
  l === void 0 && (l = {})
  const {
      ancestorScroll: u = !0,
      ancestorResize: a = !0,
      elementResize: i = typeof ResizeObserver == 'function',
      layoutShift: r = typeof IntersectionObserver == 'function',
      animationFrame: c = !1
    } = l,
    f = So(e),
    o = u || a ? [...(f ? ra(f) : []), ...ra(t)] : []
  o.forEach(v => {
    u && v.addEventListener('scroll', n, { passive: !0 }), a && v.addEventListener('resize', n)
  })
  const g = f && r ? B1(f, n) : null
  let m = -1,
    s = null
  i &&
    ((s = new ResizeObserver(v => {
      let [h] = v
      h &&
        h.target === f &&
        s &&
        (s.unobserve(t),
        cancelAnimationFrame(m),
        (m = requestAnimationFrame(() => {
          var p
          ;(p = s) == null || p.observe(t)
        }))),
        n()
    })),
    f && !c && s.observe(f),
    s.observe(t))
  let y,
    E = c ? il(e) : null
  c && x()
  function x() {
    const v = il(e)
    E && !vv(E, v) && n(), (E = v), (y = requestAnimationFrame(x))
  }
  return (
    n(),
    () => {
      var v
      o.forEach(h => {
        u && h.removeEventListener('scroll', n), a && h.removeEventListener('resize', n)
      }),
        g == null || g(),
        (v = s) == null || v.disconnect(),
        (s = null),
        c && cancelAnimationFrame(y)
    }
  )
}
const nc = fr,
  Y1 = x1,
  G1 = T1,
  X1 = E1,
  Q1 = O1,
  V1 = (e, t, n) => {
    const l = new Map(),
      u = { platform: q1, ...n },
      a = { ...u.platform, _c: l }
    return b1(e, t, { ...u, platform: a })
  }
var ui = typeof document < 'u' ? d.useLayoutEffect : d.useEffect
function qi(e, t) {
  if (e === t) return !0
  if (typeof e != typeof t) return !1
  if (typeof e == 'function' && e.toString() === t.toString()) return !0
  let n, l, u
  if (e && t && typeof e == 'object') {
    if (Array.isArray(e)) {
      if (((n = e.length), n !== t.length)) return !1
      for (l = n; l-- !== 0; ) if (!qi(e[l], t[l])) return !1
      return !0
    }
    if (((u = Object.keys(e)), (n = u.length), n !== Object.keys(t).length)) return !1
    for (l = n; l-- !== 0; ) if (!{}.hasOwnProperty.call(t, u[l])) return !1
    for (l = n; l-- !== 0; ) {
      const a = u[l]
      if (!(a === '_owner' && e.$$typeof) && !qi(e[a], t[a])) return !1
    }
    return !0
  }
  return e !== e && t !== t
}
function pv(e) {
  return typeof window > 'u' ? 1 : (e.ownerDocument.defaultView || window).devicePixelRatio || 1
}
function fd(e, t) {
  const n = pv(e)
  return Math.round(t * n) / n
}
function lc(e) {
  const t = d.useRef(e)
  return (
    ui(() => {
      t.current = e
    }),
    t
  )
}
function Z1(e) {
  e === void 0 && (e = {})
  const {
      placement: t = 'bottom',
      strategy: n = 'absolute',
      middleware: l = [],
      platform: u,
      elements: { reference: a, floating: i } = {},
      transform: r = !0,
      whileElementsMounted: c,
      open: f
    } = e,
    [o, g] = d.useState({
      x: 0,
      y: 0,
      strategy: n,
      placement: t,
      middlewareData: {},
      isPositioned: !1
    }),
    [m, s] = d.useState(l)
  qi(m, l) || s(l)
  const [y, E] = d.useState(null),
    [x, v] = d.useState(null),
    h = d.useCallback(C => {
      C !== A.current && ((A.current = C), E(C))
    }, []),
    p = d.useCallback(C => {
      C !== O.current && ((O.current = C), v(C))
    }, []),
    b = a || y,
    S = i || x,
    A = d.useRef(null),
    O = d.useRef(null),
    M = d.useRef(o),
    z = c != null,
    _ = lc(c),
    D = lc(u),
    k = lc(f),
    K = d.useCallback(() => {
      if (!A.current || !O.current) return
      const C = { placement: t, strategy: n, middleware: m }
      D.current && (C.platform = D.current),
        V1(A.current, O.current, C).then(L => {
          const q = { ...L, isPositioned: k.current !== !1 }
          V.current &&
            !qi(M.current, q) &&
            ((M.current = q),
            Ze.flushSync(() => {
              g(q)
            }))
        })
    }, [m, t, n, D, k])
  ui(() => {
    f === !1 &&
      M.current.isPositioned &&
      ((M.current.isPositioned = !1), g(C => ({ ...C, isPositioned: !1 })))
  }, [f])
  const V = d.useRef(!1)
  ui(
    () => (
      (V.current = !0),
      () => {
        V.current = !1
      }
    ),
    []
  ),
    ui(() => {
      if ((b && (A.current = b), S && (O.current = S), b && S)) {
        if (_.current) return _.current(b, S, K)
        K()
      }
    }, [b, S, K, _, z])
  const ae = d.useMemo(
      () => ({ reference: A, floating: O, setReference: h, setFloating: p }),
      [h, p]
    ),
    R = d.useMemo(() => ({ reference: b, floating: S }), [b, S]),
    H = d.useMemo(() => {
      const C = { position: n, left: 0, top: 0 }
      if (!R.floating) return C
      const L = fd(R.floating, o.x),
        q = fd(R.floating, o.y)
      return r
        ? {
            ...C,
            transform: 'translate(' + L + 'px, ' + q + 'px)',
            ...(pv(R.floating) >= 1.5 && { willChange: 'transform' })
          }
        : { position: n, left: L, top: q }
    }, [n, r, R.floating, o.x, o.y])
  return d.useMemo(
    () => ({ ...o, update: K, refs: ae, elements: R, floatingStyles: H }),
    [o, K, ae, R, H]
  )
}
const yv = (e, t) => ({ ...Y1(e), options: [e, t] }),
  k1 = (e, t) => ({ ...G1(e), options: [e, t] }),
  F1 = (e, t) => ({ ...X1(e), options: [e, t] }),
  K1 = (e, t) => ({ ...Q1(e), options: [e, t] }),
  bv = { ...cc },
  J1 = bv.useInsertionEffect,
  W1 = J1 || (e => e())
function Ev(e) {
  const t = d.useRef(() => {})
  return (
    W1(() => {
      t.current = e
    }),
    d.useCallback(function () {
      for (var n = arguments.length, l = new Array(n), u = 0; u < n; u++) l[u] = arguments[u]
      return t.current == null ? void 0 : t.current(...l)
    }, [])
  )
}
var df = typeof document < 'u' ? d.useLayoutEffect : d.useEffect
let od = !1,
  P1 = 0
const sd = () => 'floating-ui-' + Math.random().toString(36).slice(2, 6) + P1++
function I1() {
  const [e, t] = d.useState(() => (od ? sd() : void 0))
  return (
    df(() => {
      e == null && t(sd())
    }, []),
    d.useEffect(() => {
      od = !0
    }, []),
    e
  )
}
const eE = bv.useId,
  tE = eE || I1
function nE() {
  const e = new Map()
  return {
    emit(t, n) {
      var l
      ;(l = e.get(t)) == null || l.forEach(u => u(n))
    },
    on(t, n) {
      e.set(t, [...(e.get(t) || []), n])
    },
    off(t, n) {
      var l
      e.set(t, ((l = e.get(t)) == null ? void 0 : l.filter(u => u !== n)) || [])
    }
  }
}
const lE = d.createContext(null),
  uE = d.createContext(null),
  aE = () => {
    var e
    return ((e = d.useContext(lE)) == null ? void 0 : e.id) || null
  },
  iE = () => d.useContext(uE),
  rE = 'data-floating-ui-focusable'
function cE(e) {
  const { open: t = !1, onOpenChange: n, elements: l } = e,
    u = tE(),
    a = d.useRef({}),
    [i] = d.useState(() => nE()),
    r = aE() != null,
    [c, f] = d.useState(l.reference),
    o = Ev((s, y, E) => {
      ;(a.current.openEvent = s ? y : void 0),
        i.emit('openchange', { open: s, event: y, reason: E, nested: r }),
        n == null || n(s, y, E)
    }),
    g = d.useMemo(() => ({ setPositionReference: f }), []),
    m = d.useMemo(
      () => ({
        reference: c || l.reference || null,
        floating: l.floating || null,
        domReference: l.reference
      }),
      [c, l.reference, l.floating]
    )
  return d.useMemo(
    () => ({
      dataRef: a,
      open: t,
      onOpenChange: o,
      elements: m,
      events: i,
      floatingId: u,
      refs: g
    }),
    [t, o, m, i, u, g]
  )
}
function fE(e) {
  e === void 0 && (e = {})
  const { nodeId: t } = e,
    n = cE({ ...e, elements: { reference: null, floating: null, ...e.elements } }),
    l = e.rootContext || n,
    u = l.elements,
    [a, i] = d.useState(null),
    [r, c] = d.useState(null),
    o = (u == null ? void 0 : u.domReference) || a,
    g = d.useRef(null),
    m = iE()
  df(() => {
    o && (g.current = o)
  }, [o])
  const s = Z1({ ...e, elements: { ...u, ...(r && { reference: r }) } }),
    y = d.useCallback(
      p => {
        const b = Ye(p)
          ? { getBoundingClientRect: () => p.getBoundingClientRect(), contextElement: p }
          : p
        c(b), s.refs.setReference(b)
      },
      [s.refs]
    ),
    E = d.useCallback(
      p => {
        ;(Ye(p) || p === null) && ((g.current = p), i(p)),
          (Ye(s.refs.reference.current) ||
            s.refs.reference.current === null ||
            (p !== null && !Ye(p))) &&
            s.refs.setReference(p)
      },
      [s.refs]
    ),
    x = d.useMemo(
      () => ({ ...s.refs, setReference: E, setPositionReference: y, domReference: g }),
      [s.refs, E, y]
    ),
    v = d.useMemo(() => ({ ...s.elements, domReference: o }), [s.elements, o]),
    h = d.useMemo(() => ({ ...s, ...l, refs: x, elements: v, nodeId: t }), [s, x, v, t, l])
  return (
    df(() => {
      l.dataRef.current.floatingContext = h
      const p = m == null ? void 0 : m.nodesRef.current.find(b => b.id === t)
      p && (p.context = h)
    }),
    d.useMemo(() => ({ ...s, context: h, refs: x, elements: v }), [s, x, v, h])
  )
}
const dd = 'active',
  md = 'selected'
function uc(e, t, n) {
  const l = new Map(),
    u = n === 'item'
  let a = e
  if (u && e) {
    const { [dd]: i, [md]: r, ...c } = e
    a = c
  }
  return {
    ...(n === 'floating' && { tabIndex: -1, [rE]: '' }),
    ...a,
    ...t
      .map(i => {
        const r = i ? i[n] : null
        return typeof r == 'function' ? (e ? r(e) : null) : r
      })
      .concat(e)
      .reduce(
        (i, r) => (
          r &&
            Object.entries(r).forEach(c => {
              let [f, o] = c
              if (!(u && [dd, md].includes(f)))
                if (f.indexOf('on') === 0) {
                  if ((l.has(f) || l.set(f, []), typeof o == 'function')) {
                    var g
                    ;(g = l.get(f)) == null || g.push(o),
                      (i[f] = function () {
                        for (var m, s = arguments.length, y = new Array(s), E = 0; E < s; E++)
                          y[E] = arguments[E]
                        return (m = l.get(f)) == null
                          ? void 0
                          : m.map(x => x(...y)).find(x => x !== void 0)
                      })
                  }
                } else i[f] = o
            }),
          i
        ),
        {}
      )
  }
}
function oE(e) {
  e === void 0 && (e = [])
  const t = e.map(r => (r == null ? void 0 : r.reference)),
    n = e.map(r => (r == null ? void 0 : r.floating)),
    l = e.map(r => (r == null ? void 0 : r.item)),
    u = d.useCallback(r => uc(r, e, 'reference'), t),
    a = d.useCallback(r => uc(r, e, 'floating'), n),
    i = d.useCallback(r => uc(r, e, 'item'), l)
  return d.useMemo(
    () => ({ getReferenceProps: u, getFloatingProps: a, getItemProps: i }),
    [u, a, i]
  )
}
function hd(e, t) {
  return { ...e, rects: { ...e.rects, floating: { ...e.rects.floating, height: t } } }
}
const sE = e => ({
  name: 'inner',
  options: e,
  async fn(t) {
    const {
        listRef: n,
        overflowRef: l,
        onFallbackChange: u,
        offset: a = 0,
        index: i = 0,
        minItemsVisible: r = 4,
        referenceOverflowThreshold: c = 0,
        scrollRef: f,
        ...o
      } = ou(e, t),
      {
        rects: g,
        elements: { floating: m }
      } = t,
      s = n.current[i],
      y = (f == null ? void 0 : f.current) || m,
      E = m.clientTop || y.clientTop,
      x = m.clientTop !== 0,
      v = y.clientTop !== 0,
      h = m === y
    if (!s) return {}
    const p = {
        ...t,
        ...(await yv(
          -s.offsetTop - m.clientTop - g.reference.height / 2 - s.offsetHeight / 2 - a
        ).fn(t))
      },
      b = await nc(hd(p, y.scrollHeight + E + m.clientTop), o),
      S = await nc(p, { ...o, elementContext: 'reference' }),
      A = Ue(0, b.top),
      O = p.y + A,
      _ = (y.scrollHeight > y.clientHeight ? D => D : ca)(
        Ue(0, y.scrollHeight + ((x && h) || v ? E * 2 : 0) - A - Ue(0, b.bottom))
      )
    if (((y.style.maxHeight = _ + 'px'), (y.scrollTop = A), u)) {
      const D =
        y.offsetHeight < s.offsetHeight * ul(r, n.current.length) - 1 ||
        S.top >= -c ||
        S.bottom >= -c
      Ze.flushSync(() => u(D))
    }
    return (
      l && (l.current = await nc(hd({ ...p, y: O }, y.offsetHeight + E + m.clientTop), o)), { y: O }
    )
  }
})
function dE(e, t) {
  const { open: n, elements: l } = e,
    { enabled: u = !0, overflowRef: a, scrollRef: i, onChange: r } = t,
    c = Ev(r),
    f = d.useRef(!1),
    o = d.useRef(null),
    g = d.useRef(null)
  d.useEffect(() => {
    if (!u) return
    function s(E) {
      if (E.ctrlKey || !y || a.current == null) return
      const x = E.deltaY,
        v = a.current.top >= -0.5,
        h = a.current.bottom >= -0.5,
        p = y.scrollHeight - y.clientHeight,
        b = x < 0 ? -1 : 1,
        S = x < 0 ? 'max' : 'min'
      y.scrollHeight <= y.clientHeight ||
        ((!v && x > 0) || (!h && x < 0)
          ? (E.preventDefault(),
            Ze.flushSync(() => {
              c(A => A + Math[S](x, p * b))
            }))
          : /firefox/i.test(o1()) && (y.scrollTop += x))
    }
    const y = (i == null ? void 0 : i.current) || l.floating
    if (n && y)
      return (
        y.addEventListener('wheel', s),
        requestAnimationFrame(() => {
          ;(o.current = y.scrollTop), a.current != null && (g.current = { ...a.current })
        }),
        () => {
          ;(o.current = null), (g.current = null), y.removeEventListener('wheel', s)
        }
      )
  }, [u, n, l.floating, a, i, c])
  const m = d.useMemo(
    () => ({
      onKeyDown() {
        f.current = !0
      },
      onWheel() {
        f.current = !1
      },
      onPointerMove() {
        f.current = !1
      },
      onScroll() {
        const s = (i == null ? void 0 : i.current) || l.floating
        if (!(!a.current || !s || !f.current)) {
          if (o.current !== null) {
            const y = s.scrollTop - o.current
            ;((a.current.bottom < -0.5 && y < -1) || (a.current.top < -0.5 && y > 1)) &&
              Ze.flushSync(() => c(E => E + y))
          }
          requestAnimationFrame(() => {
            o.current = s.scrollTop
          })
        }
      }
    }),
    [l.floating, c, a, i]
  )
  return d.useMemo(() => (u ? { floating: m } : {}), [u, m])
}
let su = d.createContext({
  styles: void 0,
  setReference: () => {},
  setFloating: () => {},
  getReferenceProps: () => ({}),
  getFloatingProps: () => ({}),
  slot: {}
})
su.displayName = 'FloatingContext'
let To = d.createContext(null)
To.displayName = 'PlacementContext'
function mE(e) {
  return d.useMemo(() => (e ? (typeof e == 'string' ? { to: e } : e) : null), [e])
}
function hE() {
  return d.useContext(su).setReference
}
function gE() {
  return d.useContext(su).getReferenceProps
}
function vE() {
  let { getFloatingProps: e, slot: t } = d.useContext(su)
  return d.useCallback((...n) => Object.assign({}, e(...n), { 'data-anchor': t.anchor }), [e, t])
}
function pE(e = null) {
  e === !1 && (e = null), typeof e == 'string' && (e = { to: e })
  let t = d.useContext(To),
    n = d.useMemo(
      () => e,
      [
        JSON.stringify(e, (u, a) => {
          var i
          return (i = a == null ? void 0 : a.outerHTML) != null ? i : a
        })
      ]
    )
  le(() => {
    t == null || t(n ?? null)
  }, [t, n])
  let l = d.useContext(su)
  return d.useMemo(() => [l.setFloating, e ? l.styles : {}], [l.setFloating, e, l.styles])
}
let gd = 4
function yE({ children: e, enabled: t = !0 }) {
  let [n, l] = d.useState(null),
    [u, a] = d.useState(0),
    i = d.useRef(null),
    [r, c] = d.useState(null)
  bE(r)
  let f = t && n !== null && r !== null,
    { to: o = 'bottom', gap: g = 0, offset: m = 0, padding: s = 0, inner: y } = EE(n, r),
    [E, x = 'center'] = o.split(' ')
  le(() => {
    f && a(0)
  }, [f])
  let {
      refs: v,
      floatingStyles: h,
      context: p
    } = fE({
      open: f,
      placement:
        E === 'selection'
          ? x === 'center'
            ? 'bottom'
            : `bottom-${x}`
          : x === 'center'
          ? `${E}`
          : `${E}-${x}`,
      strategy: 'absolute',
      transform: !1,
      middleware: [
        yv({ mainAxis: E === 'selection' ? 0 : g, crossAxis: m }),
        k1({ padding: s }),
        E !== 'selection' && F1({ padding: s }),
        E === 'selection' && y
          ? sE({
              ...y,
              padding: s,
              overflowRef: i,
              offset: u,
              minItemsVisible: gd,
              referenceOverflowThreshold: s,
              onFallbackChange(D) {
                var k, K
                if (!D) return
                let V = p.elements.floating
                if (!V) return
                let ae = parseFloat(getComputedStyle(V).scrollPaddingBottom) || 0,
                  R = Math.min(gd, V.childElementCount),
                  H = 0,
                  C = 0
                for (let L of (K = (k = p.elements.floating) == null ? void 0 : k.childNodes) !=
                null
                  ? K
                  : [])
                  if (L instanceof HTMLElement) {
                    let q = L.offsetTop,
                      X = q + L.clientHeight + ae,
                      Ee = V.scrollTop,
                      U = Ee + V.clientHeight
                    if (q >= Ee && X <= U) R--
                    else {
                      ;(C = Math.max(0, Math.min(X, U) - Math.max(q, Ee))), (H = L.clientHeight)
                      break
                    }
                  }
                R >= 1 &&
                  a(L => {
                    let q = H * R - C + ae
                    return L >= q ? L : q
                  })
              }
            })
          : null,
        K1({
          padding: s,
          apply({ availableWidth: D, availableHeight: k, elements: K }) {
            Object.assign(K.floating.style, {
              overflow: 'auto',
              maxWidth: `${D}px`,
              maxHeight: `min(var(--anchor-max-height, 100vh), ${k}px)`
            })
          }
        })
      ].filter(Boolean),
      whileElementsMounted: $1
    }),
    [b = E, S = x] = p.placement.split('-')
  E === 'selection' && (b = 'selection')
  let A = d.useMemo(() => ({ anchor: [b, S].filter(Boolean).join(' ') }), [b, S]),
    O = dE(p, { overflowRef: i, onChange: a }),
    { getReferenceProps: M, getFloatingProps: z } = oE([O]),
    _ = j(D => {
      c(D), v.setFloating(D)
    })
  return d.createElement(
    To.Provider,
    { value: l },
    d.createElement(
      su.Provider,
      {
        value: {
          setFloating: _,
          setReference: v.setReference,
          styles: h,
          getReferenceProps: M,
          getFloatingProps: z,
          slot: A
        }
      },
      e
    )
  )
}
function bE(e) {
  le(() => {
    if (!e) return
    let t = new MutationObserver(() => {
      let n = window.getComputedStyle(e).maxHeight,
        l = parseFloat(n)
      if (isNaN(l)) return
      let u = parseInt(n)
      isNaN(u) || (l !== u && (e.style.maxHeight = `${Math.ceil(l)}px`))
    })
    return (
      t.observe(e, { attributes: !0, attributeFilter: ['style'] }),
      () => {
        t.disconnect()
      }
    )
  }, [e])
}
function EE(e, t) {
  var n, l, u
  let a = ac((n = e == null ? void 0 : e.gap) != null ? n : 'var(--anchor-gap, 0)', t),
    i = ac((l = e == null ? void 0 : e.offset) != null ? l : 'var(--anchor-offset, 0)', t),
    r = ac((u = e == null ? void 0 : e.padding) != null ? u : 'var(--anchor-padding, 0)', t)
  return { ...e, gap: a, offset: i, padding: r }
}
function ac(e, t, n = void 0) {
  let l = tn(),
    u = j((c, f) => {
      if (c == null) return [n, null]
      if (typeof c == 'number') return [c, null]
      if (typeof c == 'string') {
        if (!f) return [n, null]
        let o = vd(c, f)
        return [
          o,
          g => {
            let m = Sv(c)
            {
              let s = m.map(y => window.getComputedStyle(f).getPropertyValue(y))
              l.requestAnimationFrame(function y() {
                l.nextFrame(y)
                let E = !1
                for (let [v, h] of m.entries()) {
                  let p = window.getComputedStyle(f).getPropertyValue(h)
                  if (s[v] !== p) {
                    ;(s[v] = p), (E = !0)
                    break
                  }
                }
                if (!E) return
                let x = vd(c, f)
                o !== x && (g(x), (o = x))
              })
            }
            return l.dispose
          }
        ]
      }
      return [n, null]
    }),
    a = d.useMemo(() => u(e, t)[0], [e, t]),
    [i = a, r] = d.useState()
  return (
    le(() => {
      let [c, f] = u(e, t)
      if ((r(c), !!f)) return f(r)
    }, [e, t]),
    i
  )
}
function Sv(e) {
  let t = /var\((.*)\)/.exec(e)
  if (t) {
    let n = t[1].indexOf(',')
    if (n === -1) return [t[1]]
    let l = t[1].slice(0, n).trim(),
      u = t[1].slice(n + 1).trim()
    return u ? [l, ...Sv(u)] : [l]
  }
  return []
}
function vd(e, t) {
  let n = document.createElement('div')
  t.appendChild(n),
    n.style.setProperty('margin-top', '0px', 'important'),
    n.style.setProperty('margin-top', e, 'important')
  let l = parseFloat(window.getComputedStyle(n).marginTop) || 0
  return t.removeChild(n), l
}
function SE(e, t) {
  let [n, l] = d.useState(t)
  return !e && n !== t && l(t), e ? n : t
}
let or = d.createContext(null)
or.displayName = 'OpenClosedContext'
var Ge = (e => (
  (e[(e.Open = 1)] = 'Open'),
  (e[(e.Closed = 2)] = 'Closed'),
  (e[(e.Closing = 4)] = 'Closing'),
  (e[(e.Opening = 8)] = 'Opening'),
  e
))(Ge || {})
function wa() {
  return d.useContext(or)
}
function xv({ value: e, children: t }) {
  return N.createElement(or.Provider, { value: e }, t)
}
function xE({ children: e }) {
  return N.createElement(or.Provider, { value: null }, e)
}
function TE(e) {
  function t() {
    document.readyState !== 'loading' && (e(), document.removeEventListener('DOMContentLoaded', t))
  }
  typeof window < 'u' &&
    typeof document < 'u' &&
    (document.addEventListener('DOMContentLoaded', t), t())
}
let mn = []
TE(() => {
  function e(t) {
    if (!(t.target instanceof HTMLElement) || t.target === document.body || mn[0] === t.target)
      return
    let n = t.target
    ;(n = n.closest(Li)),
      mn.unshift(n ?? t.target),
      (mn = mn.filter(l => l != null && l.isConnected)),
      mn.splice(10)
  }
  window.addEventListener('click', e, { capture: !0 }),
    window.addEventListener('mousedown', e, { capture: !0 }),
    window.addEventListener('focus', e, { capture: !0 }),
    document.body.addEventListener('click', e, { capture: !0 }),
    document.body.addEventListener('mousedown', e, { capture: !0 }),
    document.body.addEventListener('focus', e, { capture: !0 })
})
function OE(e) {
  throw new Error('Unexpected object: ' + e)
}
var Oe = (e => (
  (e[(e.First = 0)] = 'First'),
  (e[(e.Previous = 1)] = 'Previous'),
  (e[(e.Next = 2)] = 'Next'),
  (e[(e.Last = 3)] = 'Last'),
  (e[(e.Specific = 4)] = 'Specific'),
  (e[(e.Nothing = 5)] = 'Nothing'),
  e
))(Oe || {})
function ic(e, t) {
  let n = t.resolveItems()
  if (n.length <= 0) return null
  let l = t.resolveActiveIndex(),
    u = l ?? -1
  switch (e.focus) {
    case 0: {
      for (let a = 0; a < n.length; ++a) if (!t.resolveDisabled(n[a], a, n)) return a
      return l
    }
    case 1: {
      u === -1 && (u = n.length)
      for (let a = u - 1; a >= 0; --a) if (!t.resolveDisabled(n[a], a, n)) return a
      return l
    }
    case 2: {
      for (let a = u + 1; a < n.length; ++a) if (!t.resolveDisabled(n[a], a, n)) return a
      return l
    }
    case 3: {
      for (let a = n.length - 1; a >= 0; --a) if (!t.resolveDisabled(n[a], a, n)) return a
      return l
    }
    case 4: {
      for (let a = 0; a < n.length; ++a) if (t.resolveId(n[a], a, n) === e.id) return a
      return l
    }
    case 5:
      return null
    default:
      OE(e)
  }
}
function Tv(e) {
  let t = j(e),
    n = d.useRef(!1)
  d.useEffect(
    () => (
      (n.current = !1),
      () => {
        ;(n.current = !0),
          nr(() => {
            n.current && t()
          })
      }
    ),
    [t]
  )
}
function wE() {
  let e = typeof document > 'u'
  return 'useSyncExternalStore' in cc
    ? (t => t.useSyncExternalStore)(cc)(
        () => () => {},
        () => !1,
        () => !e
      )
    : !1
}
function Aa() {
  let e = wE(),
    [t, n] = d.useState(Wn.isHandoffComplete)
  return (
    t && Wn.isHandoffComplete === !1 && n(!1),
    d.useEffect(() => {
      t !== !0 && n(!0)
    }, [t]),
    d.useEffect(() => Wn.handoff(), []),
    e ? !1 : t
  )
}
let Ov = d.createContext(!1)
function AE() {
  return d.useContext(Ov)
}
function pd(e) {
  return N.createElement(Ov.Provider, { value: e.force }, e.children)
}
function RE(e) {
  let t = AE(),
    n = d.useContext(Av),
    l = cu(e),
    [u, a] = d.useState(() => {
      var i
      if (!t && n !== null) return (i = n.current) != null ? i : null
      if (Wn.isServer) return null
      let r = l == null ? void 0 : l.getElementById('headlessui-portal-root')
      if (r) return r
      if (l === null) return null
      let c = l.createElement('div')
      return c.setAttribute('id', 'headlessui-portal-root'), l.body.appendChild(c)
    })
  return (
    d.useEffect(() => {
      u !== null && ((l != null && l.body.contains(u)) || l == null || l.body.appendChild(u))
    }, [u, l]),
    d.useEffect(() => {
      t || (n !== null && a(n.current))
    }, [n, a, t]),
    u
  )
}
let wv = d.Fragment,
  ME = ge(function (e, t) {
    let n = e,
      l = d.useRef(null),
      u = He(
        Ab(g => {
          l.current = g
        }),
        t
      ),
      a = cu(l),
      i = RE(l),
      [r] = d.useState(() => {
        var g
        return Wn.isServer
          ? null
          : (g = a == null ? void 0 : a.createElement('div')) != null
          ? g
          : null
      }),
      c = d.useContext(mf),
      f = Aa()
    le(() => {
      !i || !r || i.contains(r) || (r.setAttribute('data-headlessui-portal', ''), i.appendChild(r))
    }, [i, r]),
      le(() => {
        if (r && c) return c.register(r)
      }, [c, r]),
      Tv(() => {
        var g
        !i ||
          !r ||
          (r instanceof Node && i.contains(r) && i.removeChild(r),
          i.childNodes.length <= 0 && ((g = i.parentElement) == null || g.removeChild(i)))
      })
    let o = be()
    return f
      ? !i || !r
        ? null
        : Ze.createPortal(
            o({ ourProps: { ref: u }, theirProps: n, slot: {}, defaultTag: wv, name: 'Portal' }),
            r
          )
      : null
  })
function DE(e, t) {
  let n = He(t),
    { enabled: l = !0, ...u } = e,
    a = be()
  return l
    ? N.createElement(ME, { ...u, ref: n })
    : a({ ourProps: { ref: n }, theirProps: u, slot: {}, defaultTag: wv, name: 'Portal' })
}
let _E = d.Fragment,
  Av = d.createContext(null)
function CE(e, t) {
  let { target: n, ...l } = e,
    u = { ref: He(t) },
    a = be()
  return N.createElement(
    Av.Provider,
    { value: n },
    a({ ourProps: u, theirProps: l, defaultTag: _E, name: 'Popover.Group' })
  )
}
let mf = d.createContext(null)
function NE() {
  let e = d.useContext(mf),
    t = d.useRef([]),
    n = j(a => (t.current.push(a), e && e.register(a), () => l(a))),
    l = j(a => {
      let i = t.current.indexOf(a)
      i !== -1 && t.current.splice(i, 1), e && e.unregister(a)
    }),
    u = d.useMemo(() => ({ register: n, unregister: l, portals: t }), [n, l, t])
  return [
    t,
    d.useMemo(
      () =>
        function ({ children: a }) {
          return N.createElement(mf.Provider, { value: u }, a)
        },
      [u]
    )
  ]
}
let zE = ge(DE),
  Rv = ge(CE),
  Mv = Object.assign(zE, { Group: Rv })
function HE(e, t = typeof document < 'u' ? document.defaultView : null, n) {
  let l = ru(e, 'escape')
  tv(t, 'keydown', u => {
    l && (u.defaultPrevented || (u.key === he.Escape && n(u)))
  })
}
function LE() {
  var e
  let [t] = d.useState(() =>
      typeof window < 'u' && typeof window.matchMedia == 'function'
        ? window.matchMedia('(pointer: coarse)')
        : null
    ),
    [n, l] = d.useState((e = t == null ? void 0 : t.matches) != null ? e : !1)
  return (
    le(() => {
      if (!t) return
      function u(a) {
        l(a.matches)
      }
      return t.addEventListener('change', u), () => t.removeEventListener('change', u)
    }, [t]),
    n
  )
}
function UE({ defaultContainers: e = [], portals: t, mainTreeNode: n } = {}) {
  let l = cu(n),
    u = j(() => {
      var a, i
      let r = []
      for (let c of e)
        c !== null &&
          (c instanceof HTMLElement
            ? r.push(c)
            : 'current' in c && c.current instanceof HTMLElement && r.push(c.current))
      if (t != null && t.current) for (let c of t.current) r.push(c)
      for (let c of (a = l == null ? void 0 : l.querySelectorAll('html > *, body > *')) != null
        ? a
        : [])
        c !== document.body &&
          c !== document.head &&
          c instanceof HTMLElement &&
          c.id !== 'headlessui-portal-root' &&
          ((n &&
            (c.contains(n) ||
              c.contains((i = n == null ? void 0 : n.getRootNode()) == null ? void 0 : i.host))) ||
            r.some(f => c.contains(f)) ||
            r.push(c))
      return r
    })
  return { resolveContainers: u, contains: j(a => u().some(i => i.contains(a))) }
}
let Dv = d.createContext(null)
function yd({ children: e, node: t }) {
  let [n, l] = d.useState(null),
    u = _v(t ?? n)
  return N.createElement(
    Dv.Provider,
    { value: u },
    e,
    u === null &&
      N.createElement(ia, {
        features: Wl.Hidden,
        ref: a => {
          var i, r
          if (a) {
            for (let c of (r =
              (i = iu(a)) == null ? void 0 : i.querySelectorAll('html > *, body > *')) != null
              ? r
              : [])
              if (
                c !== document.body &&
                c !== document.head &&
                c instanceof HTMLElement &&
                c != null &&
                c.contains(a)
              ) {
                l(c)
                break
              }
          }
        }
      })
  )
}
function _v(e = null) {
  var t
  return (t = d.useContext(Dv)) != null ? t : e
}
function Oo() {
  let e = d.useRef(!1)
  return (
    le(
      () => (
        (e.current = !0),
        () => {
          e.current = !1
        }
      ),
      []
    ),
    e
  )
}
var Au = (e => ((e[(e.Forwards = 0)] = 'Forwards'), (e[(e.Backwards = 1)] = 'Backwards'), e))(
  Au || {}
)
function jE() {
  let e = d.useRef(0)
  return (
    Ig(
      !0,
      'keydown',
      t => {
        t.key === 'Tab' && (e.current = t.shiftKey ? 1 : 0)
      },
      !0
    ),
    e
  )
}
function Cv(e) {
  if (!e) return new Set()
  if (typeof e == 'function') return new Set(e())
  let t = new Set()
  for (let n of e.current) n.current instanceof HTMLElement && t.add(n.current)
  return t
}
let qE = 'div'
var $n = (e => (
  (e[(e.None = 0)] = 'None'),
  (e[(e.InitialFocus = 1)] = 'InitialFocus'),
  (e[(e.TabLock = 2)] = 'TabLock'),
  (e[(e.FocusLock = 4)] = 'FocusLock'),
  (e[(e.RestoreFocus = 8)] = 'RestoreFocus'),
  (e[(e.AutoFocus = 16)] = 'AutoFocus'),
  e
))($n || {})
function BE(e, t) {
  let n = d.useRef(null),
    l = He(n, t),
    { initialFocus: u, initialFocusFallback: a, containers: i, features: r = 15, ...c } = e
  Aa() || (r = 0)
  let f = cu(n)
  XE(r, { ownerDocument: f })
  let o = QE(r, { ownerDocument: f, container: n, initialFocus: u, initialFocusFallback: a })
  VE(r, { ownerDocument: f, container: n, containers: i, previousActiveElement: o })
  let g = jE(),
    m = j(h => {
      let p = n.current
      p &&
        (b => b())(() => {
          ke(g.current, {
            [Au.Forwards]: () => {
              Bl(p, bt.First, { skipElements: [h.relatedTarget, a] })
            },
            [Au.Backwards]: () => {
              Bl(p, bt.Last, { skipElements: [h.relatedTarget, a] })
            }
          })
        })
    }),
    s = ru(!!(r & 2), 'focus-trap#tab-lock'),
    y = tn(),
    E = d.useRef(!1),
    x = {
      ref: l,
      onKeyDown(h) {
        h.key == 'Tab' &&
          ((E.current = !0),
          y.requestAnimationFrame(() => {
            E.current = !1
          }))
      },
      onBlur(h) {
        if (!(r & 4)) return
        let p = Cv(i)
        n.current instanceof HTMLElement && p.add(n.current)
        let b = h.relatedTarget
        b instanceof HTMLElement &&
          b.dataset.headlessuiFocusGuard !== 'true' &&
          (Nv(p, b) ||
            (E.current
              ? Bl(
                  n.current,
                  ke(g.current, {
                    [Au.Forwards]: () => bt.Next,
                    [Au.Backwards]: () => bt.Previous
                  }) | bt.WrapAround,
                  { relativeTo: h.target }
                )
              : h.target instanceof HTMLElement && Ft(h.target)))
      }
    },
    v = be()
  return N.createElement(
    N.Fragment,
    null,
    s &&
      N.createElement(ia, {
        'as': 'button',
        'type': 'button',
        'data-headlessui-focus-guard': !0,
        'onFocus': m,
        'features': Wl.Focusable
      }),
    v({ ourProps: x, theirProps: c, defaultTag: qE, name: 'FocusTrap' }),
    s &&
      N.createElement(ia, {
        'as': 'button',
        'type': 'button',
        'data-headlessui-focus-guard': !0,
        'onFocus': m,
        'features': Wl.Focusable
      })
  )
}
let $E = ge(BE),
  YE = Object.assign($E, { features: $n })
function GE(e = !0) {
  let t = d.useRef(mn.slice())
  return (
    yo(
      ([n], [l]) => {
        l === !0 &&
          n === !1 &&
          nr(() => {
            t.current.splice(0)
          }),
          l === !1 && n === !0 && (t.current = mn.slice())
      },
      [e, mn, t]
    ),
    j(() => {
      var n
      return (n = t.current.find(l => l != null && l.isConnected)) != null ? n : null
    })
  )
}
function XE(e, { ownerDocument: t }) {
  let n = !!(e & 8),
    l = GE(n)
  yo(() => {
    n || ((t == null ? void 0 : t.activeElement) === (t == null ? void 0 : t.body) && Ft(l()))
  }, [n]),
    Tv(() => {
      n && Ft(l())
    })
}
function QE(e, { ownerDocument: t, container: n, initialFocus: l, initialFocusFallback: u }) {
  let a = d.useRef(null),
    i = ru(!!(e & 1), 'focus-trap#initial-focus'),
    r = Oo()
  return (
    yo(() => {
      if (e === 0) return
      if (!i) {
        u != null && u.current && Ft(u.current)
        return
      }
      let c = n.current
      c &&
        nr(() => {
          if (!r.current) return
          let f = t == null ? void 0 : t.activeElement
          if (l != null && l.current) {
            if ((l == null ? void 0 : l.current) === f) {
              a.current = f
              return
            }
          } else if (c.contains(f)) {
            a.current = f
            return
          }
          if (l != null && l.current) Ft(l.current)
          else {
            if (e & 16) {
              if (Bl(c, bt.First | bt.AutoFocus) !== ff.Error) return
            } else if (Bl(c, bt.First) !== ff.Error) return
            if (
              u != null &&
              u.current &&
              (Ft(u.current), (t == null ? void 0 : t.activeElement) === u.current)
            )
              return
          }
          a.current = t == null ? void 0 : t.activeElement
        })
    }, [u, i, e]),
    a
  )
}
function VE(e, { ownerDocument: t, container: n, containers: l, previousActiveElement: u }) {
  let a = Oo(),
    i = !!(e & 4)
  tv(
    t == null ? void 0 : t.defaultView,
    'focus',
    r => {
      if (!i || !a.current) return
      let c = Cv(l)
      n.current instanceof HTMLElement && c.add(n.current)
      let f = u.current
      if (!f) return
      let o = r.target
      o && o instanceof HTMLElement
        ? Nv(c, o)
          ? ((u.current = o), Ft(o))
          : (r.preventDefault(), r.stopPropagation(), Ft(f))
        : Ft(u.current)
    },
    !0
  )
}
function Nv(e, t) {
  for (let n of e) if (n.contains(t)) return !0
  return !1
}
function zv(e) {
  var t
  return (
    !!(e.enter || e.enterFrom || e.enterTo || e.leave || e.leaveFrom || e.leaveTo) ||
    ((t = e.as) != null ? t : Lv) !== d.Fragment ||
    N.Children.count(e.children) === 1
  )
}
let sr = d.createContext(null)
sr.displayName = 'TransitionContext'
var ZE = (e => ((e.Visible = 'visible'), (e.Hidden = 'hidden'), e))(ZE || {})
function kE() {
  let e = d.useContext(sr)
  if (e === null)
    throw new Error(
      'A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.'
    )
  return e
}
function FE() {
  let e = d.useContext(dr)
  if (e === null)
    throw new Error(
      'A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.'
    )
  return e
}
let dr = d.createContext(null)
dr.displayName = 'NestingContext'
function mr(e) {
  return 'children' in e
    ? mr(e.children)
    : e.current.filter(({ el: t }) => t.current !== null).filter(({ state: t }) => t === 'visible')
        .length > 0
}
function Hv(e, t) {
  let n = zn(e),
    l = d.useRef([]),
    u = Oo(),
    a = tn(),
    i = j((s, y = vn.Hidden) => {
      let E = l.current.findIndex(({ el: x }) => x === s)
      E !== -1 &&
        (ke(y, {
          [vn.Unmount]() {
            l.current.splice(E, 1)
          },
          [vn.Hidden]() {
            l.current[E].state = 'hidden'
          }
        }),
        a.microTask(() => {
          var x
          !mr(l) && u.current && ((x = n.current) == null || x.call(n))
        }))
    }),
    r = j(s => {
      let y = l.current.find(({ el: E }) => E === s)
      return (
        y
          ? y.state !== 'visible' && (y.state = 'visible')
          : l.current.push({ el: s, state: 'visible' }),
        () => i(s, vn.Unmount)
      )
    }),
    c = d.useRef([]),
    f = d.useRef(Promise.resolve()),
    o = d.useRef({ enter: [], leave: [] }),
    g = j((s, y, E) => {
      c.current.splice(0),
        t && (t.chains.current[y] = t.chains.current[y].filter(([x]) => x !== s)),
        t == null ||
          t.chains.current[y].push([
            s,
            new Promise(x => {
              c.current.push(x)
            })
          ]),
        t == null ||
          t.chains.current[y].push([
            s,
            new Promise(x => {
              Promise.all(o.current[y].map(([v, h]) => h)).then(() => x())
            })
          ]),
        y === 'enter'
          ? (f.current = f.current
              .then(() => (t == null ? void 0 : t.wait.current))
              .then(() => E(y)))
          : E(y)
    }),
    m = j((s, y, E) => {
      Promise.all(o.current[y].splice(0).map(([x, v]) => v))
        .then(() => {
          var x
          ;(x = c.current.shift()) == null || x()
        })
        .then(() => E(y))
    })
  return d.useMemo(
    () => ({ children: l, register: r, unregister: i, onStart: g, onStop: m, wait: f, chains: o }),
    [r, i, l, g, m, o, f]
  )
}
let Lv = d.Fragment,
  Uv = Jl.RenderStrategy
function KE(e, t) {
  var n, l
  let {
      transition: u = !0,
      beforeEnter: a,
      afterEnter: i,
      beforeLeave: r,
      afterLeave: c,
      enter: f,
      enterFrom: o,
      enterTo: g,
      entered: m,
      leave: s,
      leaveFrom: y,
      leaveTo: E,
      ...x
    } = e,
    [v, h] = d.useState(null),
    p = d.useRef(null),
    b = zv(e),
    S = He(...(b ? [p, t, h] : t === null ? [] : [t])),
    A = (n = x.unmount) == null || n ? vn.Unmount : vn.Hidden,
    { show: O, appear: M, initial: z } = kE(),
    [_, D] = d.useState(O ? 'visible' : 'hidden'),
    k = FE(),
    { register: K, unregister: V } = k
  le(() => K(p), [K, p]),
    le(() => {
      if (A === vn.Hidden && p.current) {
        if (O && _ !== 'visible') {
          D('visible')
          return
        }
        return ke(_, { hidden: () => V(p), visible: () => K(p) })
      }
    }, [_, p, K, V, O, A])
  let ae = Aa()
  le(() => {
    if (b && ae && _ === 'visible' && p.current === null)
      throw new Error('Did you forget to passthrough the `ref` to the actual DOM node?')
  }, [p, _, ae, b])
  let R = z && !M,
    H = M && O && z,
    C = d.useRef(!1),
    L = Hv(() => {
      C.current || (D('hidden'), V(p))
    }, k),
    q = j(Le => {
      C.current = !0
      let ml = Le ? 'enter' : 'leave'
      L.onStart(p, ml, Ln => {
        Ln === 'enter' ? a == null || a() : Ln === 'leave' && (r == null || r())
      })
    }),
    X = j(Le => {
      let ml = Le ? 'enter' : 'leave'
      ;(C.current = !1),
        L.onStop(p, ml, Ln => {
          Ln === 'enter' ? i == null || i() : Ln === 'leave' && (c == null || c())
        }),
        ml === 'leave' && !mr(L) && (D('hidden'), V(p))
    })
  d.useEffect(() => {
    ;(b && u) || (q(O), X(O))
  }, [O, b, u])
  let Ee = !(!u || !b || !ae || R),
    [, U] = av(Ee, v, O, { start: q, end: X }),
    I = cn({
      ref: S,
      className:
        ((l = rf(
          x.className,
          H && f,
          H && o,
          U.enter && f,
          U.enter && U.closed && o,
          U.enter && !U.closed && g,
          U.leave && s,
          U.leave && !U.closed && y,
          U.leave && U.closed && E,
          !U.transition && O && m
        )) == null
          ? void 0
          : l.trim()) || void 0,
      ...uv(U)
    }),
    Se = 0
  _ === 'visible' && (Se |= Ge.Open),
    _ === 'hidden' && (Se |= Ge.Closed),
    U.enter && (Se |= Ge.Opening),
    U.leave && (Se |= Ge.Closing)
  let Hn = be()
  return N.createElement(
    dr.Provider,
    { value: L },
    N.createElement(
      xv,
      { value: Se },
      Hn({
        ourProps: I,
        theirProps: x,
        defaultTag: Lv,
        features: Uv,
        visible: _ === 'visible',
        name: 'Transition.Child'
      })
    )
  )
}
function JE(e, t) {
  let { show: n, appear: l = !1, unmount: u = !0, ...a } = e,
    i = d.useRef(null),
    r = zv(e),
    c = He(...(r ? [i, t] : t === null ? [] : [t]))
  Aa()
  let f = wa()
  if ((n === void 0 && f !== null && (n = (f & Ge.Open) === Ge.Open), n === void 0))
    throw new Error('A <Transition /> is used but it is missing a `show={true | false}` prop.')
  let [o, g] = d.useState(n ? 'visible' : 'hidden'),
    m = Hv(() => {
      n || g('hidden')
    }),
    [s, y] = d.useState(!0),
    E = d.useRef([n])
  le(() => {
    s !== !1 && E.current[E.current.length - 1] !== n && (E.current.push(n), y(!1))
  }, [E, n])
  let x = d.useMemo(() => ({ show: n, appear: l, initial: s }), [n, l, s])
  le(() => {
    n ? g('visible') : !mr(m) && i.current !== null && g('hidden')
  }, [n, m])
  let v = { unmount: u },
    h = j(() => {
      var S
      s && y(!1), (S = e.beforeEnter) == null || S.call(e)
    }),
    p = j(() => {
      var S
      s && y(!1), (S = e.beforeLeave) == null || S.call(e)
    }),
    b = be()
  return N.createElement(
    dr.Provider,
    { value: m },
    N.createElement(
      sr.Provider,
      { value: x },
      b({
        ourProps: {
          ...v,
          as: d.Fragment,
          children: N.createElement(jv, { ref: c, ...v, ...a, beforeEnter: h, beforeLeave: p })
        },
        theirProps: {},
        defaultTag: d.Fragment,
        features: Uv,
        visible: o === 'visible',
        name: 'Transition'
      })
    )
  )
}
function WE(e, t) {
  let n = d.useContext(sr) !== null,
    l = wa() !== null
  return N.createElement(
    N.Fragment,
    null,
    !n && l ? N.createElement(hf, { ref: t, ...e }) : N.createElement(jv, { ref: t, ...e })
  )
}
let hf = ge(JE),
  jv = ge(KE),
  wo = ge(WE),
  PE = Object.assign(hf, { Child: wo, Root: hf })
var IE = (e => ((e[(e.Open = 0)] = 'Open'), (e[(e.Closed = 1)] = 'Closed'), e))(IE || {}),
  eS = (e => ((e[(e.SetTitleId = 0)] = 'SetTitleId'), e))(eS || {})
let tS = {
    0(e, t) {
      return e.titleId === t.id ? e : { ...e, titleId: t.id }
    }
  },
  Ao = d.createContext(null)
Ao.displayName = 'DialogContext'
function hr(e) {
  let t = d.useContext(Ao)
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Dialog /> component.`)
    throw (Error.captureStackTrace && Error.captureStackTrace(n, hr), n)
  }
  return t
}
function nS(e, t) {
  return ke(t.type, tS, e, t)
}
let bd = ge(function (e, t) {
    let n = d.useId(),
      {
        id: l = `headlessui-dialog-${n}`,
        open: u,
        onClose: a,
        initialFocus: i,
        role: r = 'dialog',
        autoFocus: c = !0,
        __demoMode: f = !1,
        unmount: o = !1,
        ...g
      } = e,
      m = d.useRef(!1)
    r = (function () {
      return r === 'dialog' || r === 'alertdialog' ? r : (m.current || (m.current = !0), 'dialog')
    })()
    let s = wa()
    u === void 0 && s !== null && (u = (s & Ge.Open) === Ge.Open)
    let y = d.useRef(null),
      E = He(y, t),
      x = cu(y),
      v = u ? 0 : 1,
      [h, p] = d.useReducer(nS, { titleId: null, descriptionId: null, panelRef: d.createRef() }),
      b = j(() => a(!1)),
      S = j(X => p({ type: 0, id: X })),
      A = Aa() ? v === 0 : !1,
      [O, M] = NE(),
      z = {
        get current() {
          var X
          return (X = h.panelRef.current) != null ? X : y.current
        }
      },
      _ = _v(),
      { resolveContainers: D } = UE({ mainTreeNode: _, portals: O, defaultContainers: [z] }),
      k = s !== null ? (s & Ge.Closing) === Ge.Closing : !1
    kg(f || k ? !1 : A, {
      allowed: j(() => {
        var X, Ee
        return [
          (Ee = (X = y.current) == null ? void 0 : X.closest('[data-headlessui-portal]')) != null
            ? Ee
            : null
        ]
      }),
      disallowed: j(() => {
        var X
        return [
          (X = _ == null ? void 0 : _.closest('body > *:not(#headlessui-portal-root)')) != null
            ? X
            : null
        ]
      })
    }),
      ev(A, D, X => {
        X.preventDefault(), b()
      }),
      HE(A, x == null ? void 0 : x.defaultView, X => {
        X.preventDefault(),
          X.stopPropagation(),
          document.activeElement &&
            'blur' in document.activeElement &&
            typeof document.activeElement.blur == 'function' &&
            document.activeElement.blur(),
          b()
      }),
      lv(f || k ? !1 : A, x, D),
      Fg(A, y, b)
    let [K, V] = $g(),
      ae = d.useMemo(
        () => [{ dialogState: v, close: b, setTitleId: S, unmount: o }, h],
        [v, h, b, S, o]
      ),
      R = d.useMemo(() => ({ open: v === 0 }), [v]),
      H = {
        'ref': E,
        'id': l,
        'role': r,
        'tabIndex': -1,
        'aria-modal': f ? void 0 : v === 0 ? !0 : void 0,
        'aria-labelledby': h.titleId,
        'aria-describedby': K,
        'unmount': o
      },
      C = !LE(),
      L = $n.None
    A &&
      !f &&
      ((L |= $n.RestoreFocus),
      (L |= $n.TabLock),
      c && (L |= $n.AutoFocus),
      C && (L |= $n.InitialFocus))
    let q = be()
    return N.createElement(
      xE,
      null,
      N.createElement(
        pd,
        { force: !0 },
        N.createElement(
          Mv,
          null,
          N.createElement(
            Ao.Provider,
            { value: ae },
            N.createElement(
              Rv,
              { target: y },
              N.createElement(
                pd,
                { force: !1 },
                N.createElement(
                  V,
                  { slot: R },
                  N.createElement(
                    M,
                    null,
                    N.createElement(
                      YE,
                      { initialFocus: i, initialFocusFallback: y, containers: D, features: L },
                      N.createElement(
                        Hb,
                        { value: b },
                        q({
                          ourProps: H,
                          theirProps: g,
                          slot: R,
                          defaultTag: lS,
                          features: uS,
                          visible: v === 0,
                          name: 'Dialog'
                        })
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  }),
  lS = 'div',
  uS = Jl.RenderStrategy | Jl.Static
function aS(e, t) {
  let { transition: n = !1, open: l, ...u } = e,
    a = wa(),
    i = e.hasOwnProperty('open') || a !== null,
    r = e.hasOwnProperty('onClose')
  if (!i && !r)
    throw new Error(
      'You have to provide an `open` and an `onClose` prop to the `Dialog` component.'
    )
  if (!i)
    throw new Error('You provided an `onClose` prop to the `Dialog`, but forgot an `open` prop.')
  if (!r)
    throw new Error('You provided an `open` prop to the `Dialog`, but forgot an `onClose` prop.')
  if (!a && typeof e.open != 'boolean')
    throw new Error(
      `You provided an \`open\` prop to the \`Dialog\`, but the value is not a boolean. Received: ${e.open}`
    )
  if (typeof e.onClose != 'function')
    throw new Error(
      `You provided an \`onClose\` prop to the \`Dialog\`, but the value is not a function. Received: ${e.onClose}`
    )
  return (l !== void 0 || n) && !u.static
    ? N.createElement(
        yd,
        null,
        N.createElement(
          PE,
          { show: l, transition: n, unmount: u.unmount },
          N.createElement(bd, { ref: t, ...u })
        )
      )
    : N.createElement(yd, null, N.createElement(bd, { ref: t, open: l, ...u }))
}
let iS = 'div'
function rS(e, t) {
  let n = d.useId(),
    { id: l = `headlessui-dialog-panel-${n}`, transition: u = !1, ...a } = e,
    [{ dialogState: i, unmount: r }, c] = hr('Dialog.Panel'),
    f = He(t, c.panelRef),
    o = d.useMemo(() => ({ open: i === 0 }), [i]),
    g = j(x => {
      x.stopPropagation()
    }),
    m = { ref: f, id: l, onClick: g },
    s = u ? wo : d.Fragment,
    y = u ? { unmount: r } : {},
    E = be()
  return N.createElement(
    s,
    { ...y },
    E({ ourProps: m, theirProps: a, slot: o, defaultTag: iS, name: 'Dialog.Panel' })
  )
}
let cS = 'div'
function fS(e, t) {
  let { transition: n = !1, ...l } = e,
    [{ dialogState: u, unmount: a }] = hr('Dialog.Backdrop'),
    i = d.useMemo(() => ({ open: u === 0 }), [u]),
    r = { 'ref': t, 'aria-hidden': !0 },
    c = n ? wo : d.Fragment,
    f = n ? { unmount: a } : {},
    o = be()
  return N.createElement(
    c,
    { ...f },
    o({ ourProps: r, theirProps: l, slot: i, defaultTag: cS, name: 'Dialog.Backdrop' })
  )
}
let oS = 'h2'
function sS(e, t) {
  let n = d.useId(),
    { id: l = `headlessui-dialog-title-${n}`, ...u } = e,
    [{ dialogState: a, setTitleId: i }] = hr('Dialog.Title'),
    r = He(t)
  d.useEffect(() => (i(l), () => i(null)), [l, i])
  let c = d.useMemo(() => ({ open: a === 0 }), [a]),
    f = { ref: r, id: l }
  return be()({ ourProps: f, theirProps: u, slot: c, defaultTag: oS, name: 'Dialog.Title' })
}
let dS = ge(aS),
  qv = ge(rS),
  mS = ge(fS),
  Bv = ge(sS),
  hS = Object.assign(dS, { Panel: qv, Title: Bv, Description: Yg })
function gS(e, t) {
  let n = d.useRef({ left: 0, top: 0 })
  if (
    (le(() => {
      if (!t) return
      let u = t.getBoundingClientRect()
      u && (n.current = u)
    }, [e, t]),
    t == null || !e || t === document.activeElement)
  )
    return !1
  let l = t.getBoundingClientRect()
  return l.top !== n.current.top || l.left !== n.current.left
}
let Ed =
  /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g
function Sd(e) {
  var t, n
  let l = (t = e.innerText) != null ? t : '',
    u = e.cloneNode(!0)
  if (!(u instanceof HTMLElement)) return l
  let a = !1
  for (let r of u.querySelectorAll('[hidden],[aria-hidden],[role="img"]')) r.remove(), (a = !0)
  let i = a ? ((n = u.innerText) != null ? n : '') : l
  return Ed.test(i) && (i = i.replace(Ed, '')), i
}
function vS(e) {
  let t = e.getAttribute('aria-label')
  if (typeof t == 'string') return t.trim()
  let n = e.getAttribute('aria-labelledby')
  if (n) {
    let l = n
      .split(' ')
      .map(u => {
        let a = document.getElementById(u)
        if (a) {
          let i = a.getAttribute('aria-label')
          return typeof i == 'string' ? i.trim() : Sd(a).trim()
        }
        return null
      })
      .filter(Boolean)
    if (l.length > 0) return l.join(', ')
  }
  return Sd(e).trim()
}
function pS(e) {
  let t = d.useRef(''),
    n = d.useRef('')
  return j(() => {
    let l = e.current
    if (!l) return ''
    let u = l.innerText
    if (t.current === u) return n.current
    let a = vS(l).trim().toLowerCase()
    return (t.current = u), (n.current = a), a
  })
}
var yS = (e => ((e[(e.Open = 0)] = 'Open'), (e[(e.Closed = 1)] = 'Closed'), e))(yS || {}),
  bS = (e => ((e[(e.Single = 0)] = 'Single'), (e[(e.Multi = 1)] = 'Multi'), e))(bS || {}),
  ES = (e => ((e[(e.Pointer = 0)] = 'Pointer'), (e[(e.Other = 1)] = 'Other'), e))(ES || {}),
  SS = (e => (
    (e[(e.OpenListbox = 0)] = 'OpenListbox'),
    (e[(e.CloseListbox = 1)] = 'CloseListbox'),
    (e[(e.GoToOption = 2)] = 'GoToOption'),
    (e[(e.Search = 3)] = 'Search'),
    (e[(e.ClearSearch = 4)] = 'ClearSearch'),
    (e[(e.RegisterOption = 5)] = 'RegisterOption'),
    (e[(e.UnregisterOption = 6)] = 'UnregisterOption'),
    (e[(e.SetButtonElement = 7)] = 'SetButtonElement'),
    (e[(e.SetOptionsElement = 8)] = 'SetOptionsElement'),
    e
  ))(SS || {})
function rc(e, t = n => n) {
  let n = e.activeOptionIndex !== null ? e.options[e.activeOptionIndex] : null,
    l = Wg(t(e.options.slice()), a => a.dataRef.current.domRef.current),
    u = n ? l.indexOf(n) : null
  return u === -1 && (u = null), { options: l, activeOptionIndex: u }
}
let xS = {
    1(e) {
      return e.dataRef.current.disabled || e.listboxState === 1
        ? e
        : { ...e, activeOptionIndex: null, listboxState: 1, __demoMode: !1 }
    },
    0(e) {
      if (e.dataRef.current.disabled || e.listboxState === 0) return e
      let t = e.activeOptionIndex,
        { isSelected: n } = e.dataRef.current,
        l = e.options.findIndex(u => n(u.dataRef.current.value))
      return l !== -1 && (t = l), { ...e, listboxState: 0, activeOptionIndex: t, __demoMode: !1 }
    },
    2(e, t) {
      var n, l, u, a, i
      if (e.dataRef.current.disabled || e.listboxState === 1) return e
      let r = {
        ...e,
        searchQuery: '',
        activationTrigger: (n = t.trigger) != null ? n : 1,
        __demoMode: !1
      }
      if (t.focus === Oe.Nothing) return { ...r, activeOptionIndex: null }
      if (t.focus === Oe.Specific)
        return { ...r, activeOptionIndex: e.options.findIndex(o => o.id === t.id) }
      if (t.focus === Oe.Previous) {
        let o = e.activeOptionIndex
        if (o !== null) {
          let g = e.options[o].dataRef.current.domRef,
            m = ic(t, {
              resolveItems: () => e.options,
              resolveActiveIndex: () => e.activeOptionIndex,
              resolveId: s => s.id,
              resolveDisabled: s => s.dataRef.current.disabled
            })
          if (m !== null) {
            let s = e.options[m].dataRef.current.domRef
            if (
              ((l = g.current) == null ? void 0 : l.previousElementSibling) === s.current ||
              ((u = s.current) == null ? void 0 : u.previousElementSibling) === null
            )
              return { ...r, activeOptionIndex: m }
          }
        }
      } else if (t.focus === Oe.Next) {
        let o = e.activeOptionIndex
        if (o !== null) {
          let g = e.options[o].dataRef.current.domRef,
            m = ic(t, {
              resolveItems: () => e.options,
              resolveActiveIndex: () => e.activeOptionIndex,
              resolveId: s => s.id,
              resolveDisabled: s => s.dataRef.current.disabled
            })
          if (m !== null) {
            let s = e.options[m].dataRef.current.domRef
            if (
              ((a = g.current) == null ? void 0 : a.nextElementSibling) === s.current ||
              ((i = s.current) == null ? void 0 : i.nextElementSibling) === null
            )
              return { ...r, activeOptionIndex: m }
          }
        }
      }
      let c = rc(e),
        f = ic(t, {
          resolveItems: () => c.options,
          resolveActiveIndex: () => c.activeOptionIndex,
          resolveId: o => o.id,
          resolveDisabled: o => o.dataRef.current.disabled
        })
      return { ...r, ...c, activeOptionIndex: f }
    },
    3: (e, t) => {
      if (e.dataRef.current.disabled || e.listboxState === 1) return e
      let n = e.searchQuery !== '' ? 0 : 1,
        l = e.searchQuery + t.value.toLowerCase(),
        u = (
          e.activeOptionIndex !== null
            ? e.options
                .slice(e.activeOptionIndex + n)
                .concat(e.options.slice(0, e.activeOptionIndex + n))
            : e.options
        ).find(i => {
          var r
          return (
            !i.dataRef.current.disabled &&
            ((r = i.dataRef.current.textValue) == null ? void 0 : r.startsWith(l))
          )
        }),
        a = u ? e.options.indexOf(u) : -1
      return a === -1 || a === e.activeOptionIndex
        ? { ...e, searchQuery: l }
        : { ...e, searchQuery: l, activeOptionIndex: a, activationTrigger: 1 }
    },
    4(e) {
      return e.dataRef.current.disabled || e.listboxState === 1 || e.searchQuery === ''
        ? e
        : { ...e, searchQuery: '' }
    },
    5: (e, t) => {
      let n = { id: t.id, dataRef: t.dataRef },
        l = rc(e, u => [...u, n])
      return (
        e.activeOptionIndex === null &&
          e.dataRef.current.isSelected(t.dataRef.current.value) &&
          (l.activeOptionIndex = l.options.indexOf(n)),
        { ...e, ...l }
      )
    },
    6: (e, t) => {
      let n = rc(e, l => {
        let u = l.findIndex(a => a.id === t.id)
        return u !== -1 && l.splice(u, 1), l
      })
      return { ...e, ...n, activationTrigger: 1 }
    },
    7: (e, t) => (e.buttonElement === t.element ? e : { ...e, buttonElement: t.element }),
    8: (e, t) => (e.optionsElement === t.element ? e : { ...e, optionsElement: t.element })
  },
  Ro = d.createContext(null)
Ro.displayName = 'ListboxActionsContext'
function gr(e) {
  let t = d.useContext(Ro)
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Listbox /> component.`)
    throw (Error.captureStackTrace && Error.captureStackTrace(n, gr), n)
  }
  return t
}
let vr = d.createContext(null)
vr.displayName = 'ListboxDataContext'
function Ra(e) {
  let t = d.useContext(vr)
  if (t === null) {
    let n = new Error(`<${e} /> is missing a parent <Listbox /> component.`)
    throw (Error.captureStackTrace && Error.captureStackTrace(n, Ra), n)
  }
  return t
}
function TS(e, t) {
  return ke(t.type, xS, e, t)
}
let OS = d.Fragment
function wS(e, t) {
  var n
  let l = lr(),
    {
      value: u,
      defaultValue: a,
      form: i,
      name: r,
      onChange: c,
      by: f,
      invalid: o = !1,
      disabled: g = l || !1,
      horizontal: m = !1,
      multiple: s = !1,
      __demoMode: y = !1,
      ...E
    } = e
  const x = m ? 'horizontal' : 'vertical'
  let v = He(t),
    h = _g(a),
    [p = s ? [] : void 0, b] = Dg(u, c, h),
    [S, A] = d.useReducer(TS, {
      dataRef: d.createRef(),
      listboxState: y ? 0 : 1,
      options: [],
      searchQuery: '',
      activeOptionIndex: null,
      activationTrigger: 1,
      optionsVisible: !1,
      buttonElement: null,
      optionsElement: null,
      __demoMode: y
    }),
    O = d.useRef({ static: !1, hold: !1 }),
    M = d.useRef(new Map()),
    z = Ub(f),
    _ = d.useCallback(
      ie => ke(D.mode, { 1: () => p.some(_e => z(_e, ie)), 0: () => z(p, ie) }),
      [p]
    ),
    D = d.useMemo(
      () => ({
        ...S,
        value: p,
        disabled: g,
        invalid: o,
        mode: s ? 1 : 0,
        orientation: x,
        compare: z,
        isSelected: _,
        optionsPropsRef: O,
        listRef: M
      }),
      [p, g, o, s, S, M]
    )
  le(() => {
    S.dataRef.current = D
  }, [D])
  let k = D.listboxState === 0
  ev(k, [D.buttonElement, D.optionsElement], (ie, _e) => {
    var Tt
    A({ type: 1 }),
      Jg(_e, po.Loose) || (ie.preventDefault(), (Tt = D.buttonElement) == null || Tt.focus())
  })
  let K = d.useMemo(
      () => ({ open: D.listboxState === 0, disabled: g, invalid: o, value: p }),
      [D, g, p, o]
    ),
    V = j(ie => {
      let _e = D.options.find(Tt => Tt.id === ie)
      _e && X(_e.dataRef.current.value)
    }),
    ae = j(() => {
      if (D.activeOptionIndex !== null) {
        let { dataRef: ie, id: _e } = D.options[D.activeOptionIndex]
        X(ie.current.value), A({ type: 2, focus: Oe.Specific, id: _e })
      }
    }),
    R = j(() => A({ type: 0 })),
    H = j(() => A({ type: 1 })),
    C = tn(),
    L = j((ie, _e, Tt) => {
      C.dispose(),
        C.microTask(() =>
          ie === Oe.Specific
            ? A({ type: 2, focus: Oe.Specific, id: _e, trigger: Tt })
            : A({ type: 2, focus: ie, trigger: Tt })
        )
    }),
    q = j((ie, _e) => (A({ type: 5, id: ie, dataRef: _e }), () => A({ type: 6, id: ie }))),
    X = j(ie =>
      ke(D.mode, {
        0() {
          return b == null ? void 0 : b(ie)
        },
        1() {
          let _e = D.value.slice(),
            Tt = _e.findIndex(Fv => z(Fv, ie))
          return Tt === -1 ? _e.push(ie) : _e.splice(Tt, 1), b == null ? void 0 : b(_e)
        }
      })
    ),
    Ee = j(ie => A({ type: 3, value: ie })),
    U = j(() => A({ type: 4 })),
    I = j(ie => {
      A({ type: 7, element: ie })
    }),
    Se = j(ie => {
      A({ type: 8, element: ie })
    }),
    Hn = d.useMemo(
      () => ({
        onChange: X,
        registerOption: q,
        goToOption: L,
        closeListbox: H,
        openListbox: R,
        selectActiveOption: ae,
        selectOption: V,
        search: Ee,
        clearSearch: U,
        setButtonElement: I,
        setOptionsElement: Se
      }),
      []
    ),
    [Le, ml] = Xg({ inherit: !0 }),
    Ln = { ref: v },
    Zv = d.useCallback(() => {
      if (h !== void 0) return b == null ? void 0 : b(h)
    }, [b, h]),
    kv = be()
  return N.createElement(
    ml,
    {
      value: Le,
      props: { htmlFor: (n = D.buttonElement) == null ? void 0 : n.id },
      slot: { open: D.listboxState === 0, disabled: g }
    },
    N.createElement(
      yE,
      null,
      N.createElement(
        Ro.Provider,
        { value: Hn },
        N.createElement(
          vr.Provider,
          { value: D },
          N.createElement(
            xv,
            { value: ke(D.listboxState, { 0: Ge.Open, 1: Ge.Closed }) },
            r != null &&
              p != null &&
              N.createElement(Lg, { disabled: g, data: { [r]: p }, form: i, onReset: Zv }),
            kv({ ourProps: Ln, theirProps: E, slot: K, defaultTag: OS, name: 'Listbox' })
          )
        )
      )
    )
  )
}
let AS = 'button'
function RS(e, t) {
  var n
  let l = Ra('Listbox.Button'),
    u = gr('Listbox.Button'),
    a = d.useId(),
    i = go(),
    {
      id: r = i || `headlessui-listbox-button-${a}`,
      disabled: c = l.disabled || !1,
      autoFocus: f = !1,
      ...o
    } = e,
    g = He(t, hE(), u.setButtonElement),
    m = gE(),
    s = j(D => {
      switch (D.key) {
        case he.Enter:
          Hg(D.currentTarget)
          break
        case he.Space:
        case he.ArrowDown:
          D.preventDefault(), Ze.flushSync(() => u.openListbox()), l.value || u.goToOption(Oe.First)
          break
        case he.ArrowUp:
          D.preventDefault(), Ze.flushSync(() => u.openListbox()), l.value || u.goToOption(Oe.Last)
          break
      }
    }),
    y = j(D => {
      switch (D.key) {
        case he.Space:
          D.preventDefault()
          break
      }
    }),
    E = j(D => {
      var k
      if (Ug(D.currentTarget)) return D.preventDefault()
      l.listboxState === 0
        ? (Ze.flushSync(() => u.closeListbox()),
          (k = l.buttonElement) == null || k.focus({ preventScroll: !0 }))
        : (D.preventDefault(), u.openListbox())
    }),
    x = j(D => D.preventDefault()),
    v = vo([r]),
    h = Bg(),
    { isFocusVisible: p, focusProps: b } = Ag({ autoFocus: f }),
    { isHovered: S, hoverProps: A } = wg({ isDisabled: c }),
    { pressed: O, pressProps: M } = Rg({ disabled: c }),
    z = d.useMemo(
      () => ({
        open: l.listboxState === 0,
        active: O || l.listboxState === 0,
        disabled: c,
        invalid: l.invalid,
        value: l.value,
        hover: S,
        focus: p,
        autofocus: f
      }),
      [l.listboxState, l.value, c, S, p, O, l.invalid, f]
    ),
    _ = ho(
      m(),
      {
        'ref': g,
        'id': r,
        'type': nv(e, l.buttonElement),
        'aria-haspopup': 'listbox',
        'aria-controls': (n = l.optionsElement) == null ? void 0 : n.id,
        'aria-expanded': l.listboxState === 0,
        'aria-labelledby': v,
        'aria-describedby': h,
        'disabled': c || void 0,
        'autoFocus': f,
        'onKeyDown': s,
        'onKeyUp': y,
        'onKeyPress': x,
        'onClick': E
      },
      b,
      A,
      M
    )
  return be()({ ourProps: _, theirProps: o, slot: z, defaultTag: AS, name: 'Listbox.Button' })
}
let $v = d.createContext(!1),
  MS = 'div',
  DS = Jl.RenderStrategy | Jl.Static
function _S(e, t) {
  var n, l
  let u = d.useId(),
    {
      id: a = `headlessui-listbox-options-${u}`,
      anchor: i,
      portal: r = !1,
      modal: c = !0,
      transition: f = !1,
      ...o
    } = e,
    g = mE(i),
    [m, s] = d.useState(null)
  g && (r = !0)
  let y = Ra('Listbox.Options'),
    E = gr('Listbox.Options'),
    x = cu(y.optionsElement),
    v = wa(),
    [h, p] = av(f, m, v !== null ? (v & Ge.Open) === Ge.Open : y.listboxState === 0)
  Fg(h, y.buttonElement, E.closeListbox)
  let b = y.__demoMode ? !1 : c && y.listboxState === 0
  lv(b, x)
  let S = y.__demoMode ? !1 : c && y.listboxState === 0
  kg(S, {
    allowed: d.useCallback(
      () => [y.buttonElement, y.optionsElement],
      [y.buttonElement, y.optionsElement]
    )
  })
  let A = y.listboxState !== 0,
    O = gS(A, y.buttonElement) ? !1 : h,
    M = h && y.listboxState === 1,
    z = SE(M, y.value),
    _ = j(U => y.compare(z, U)),
    D = d.useMemo(() => {
      var U
      if (g == null || !((U = g == null ? void 0 : g.to) != null && U.includes('selection')))
        return null
      let I = y.options.findIndex(Se => _(Se.dataRef.current.value))
      return I === -1 && (I = 0), I
    }, [g, y.options]),
    k = (() => {
      if (g == null) return
      if (D === null) return { ...g, inner: void 0 }
      let U = Array.from(y.listRef.current.values())
      return { ...g, inner: { listRef: { current: U }, index: D } }
    })(),
    [K, V] = pE(k),
    ae = vE(),
    R = He(t, g ? K : null, E.setOptionsElement, s),
    H = tn()
  d.useEffect(() => {
    var U
    let I = y.optionsElement
    I &&
      y.listboxState === 0 &&
      I !== ((U = iu(I)) == null ? void 0 : U.activeElement) &&
      (I == null || I.focus({ preventScroll: !0 }))
  }, [y.listboxState, y.optionsElement])
  let C = j(U => {
      var I, Se
      switch ((H.dispose(), U.key)) {
        case he.Space:
          if (y.searchQuery !== '') return U.preventDefault(), U.stopPropagation(), E.search(U.key)
        case he.Enter:
          if ((U.preventDefault(), U.stopPropagation(), y.activeOptionIndex !== null)) {
            let { dataRef: Hn } = y.options[y.activeOptionIndex]
            E.onChange(Hn.current.value)
          }
          y.mode === 0 &&
            (Ze.flushSync(() => E.closeListbox()),
            (I = y.buttonElement) == null || I.focus({ preventScroll: !0 }))
          break
        case ke(y.orientation, { vertical: he.ArrowDown, horizontal: he.ArrowRight }):
          return U.preventDefault(), U.stopPropagation(), E.goToOption(Oe.Next)
        case ke(y.orientation, { vertical: he.ArrowUp, horizontal: he.ArrowLeft }):
          return U.preventDefault(), U.stopPropagation(), E.goToOption(Oe.Previous)
        case he.Home:
        case he.PageUp:
          return U.preventDefault(), U.stopPropagation(), E.goToOption(Oe.First)
        case he.End:
        case he.PageDown:
          return U.preventDefault(), U.stopPropagation(), E.goToOption(Oe.Last)
        case he.Escape:
          U.preventDefault(),
            U.stopPropagation(),
            Ze.flushSync(() => E.closeListbox()),
            (Se = y.buttonElement) == null || Se.focus({ preventScroll: !0 })
          return
        case he.Tab:
          U.preventDefault(),
            U.stopPropagation(),
            Ze.flushSync(() => E.closeListbox()),
            kb(y.buttonElement, U.shiftKey ? bt.Previous : bt.Next)
          break
        default:
          U.key.length === 1 && (E.search(U.key), H.setTimeout(() => E.clearSearch(), 350))
          break
      }
    }),
    L = (n = y.buttonElement) == null ? void 0 : n.id,
    q = d.useMemo(() => ({ open: y.listboxState === 0 }), [y.listboxState]),
    X = ho(g ? ae() : {}, {
      'id': a,
      'ref': R,
      'aria-activedescendant':
        y.activeOptionIndex === null || (l = y.options[y.activeOptionIndex]) == null
          ? void 0
          : l.id,
      'aria-multiselectable': y.mode === 1 ? !0 : void 0,
      'aria-labelledby': L,
      'aria-orientation': y.orientation,
      'onKeyDown': C,
      'role': 'listbox',
      'tabIndex': y.listboxState === 0 ? 0 : void 0,
      'style': { ...o.style, ...V, '--button-width': qb(y.buttonElement, !0).width },
      ...uv(p)
    }),
    Ee = be()
  return N.createElement(
    Mv,
    { enabled: r ? e.static || h : !1 },
    N.createElement(
      vr.Provider,
      { value: y.mode === 1 ? y : { ...y, isSelected: _ } },
      Ee({
        ourProps: X,
        theirProps: o,
        slot: q,
        defaultTag: MS,
        features: DS,
        visible: O,
        name: 'Listbox.Options'
      })
    )
  )
}
let CS = 'div'
function NS(e, t) {
  let n = d.useId(),
    { id: l = `headlessui-listbox-option-${n}`, disabled: u = !1, value: a, ...i } = e,
    r = d.useContext($v) === !0,
    c = Ra('Listbox.Option'),
    f = gr('Listbox.Option'),
    o = c.activeOptionIndex !== null ? c.options[c.activeOptionIndex].id === l : !1,
    g = c.isSelected(a),
    m = d.useRef(null),
    s = pS(m),
    y = zn({
      disabled: u,
      value: a,
      domRef: m,
      get textValue() {
        return s()
      }
    }),
    E = He(t, m, z => {
      z ? c.listRef.current.set(l, z) : c.listRef.current.delete(l)
    })
  le(() => {
    if (!c.__demoMode && c.listboxState === 0 && o && c.activationTrigger !== 0)
      return en().requestAnimationFrame(() => {
        var z, _
        ;(_ = (z = m.current) == null ? void 0 : z.scrollIntoView) == null ||
          _.call(z, { block: 'nearest' })
      })
  }, [m, o, c.__demoMode, c.listboxState, c.activationTrigger, c.activeOptionIndex]),
    le(() => {
      if (!r) return f.registerOption(l, y)
    }, [y, l, r])
  let x = j(z => {
      var _
      if (u) return z.preventDefault()
      f.onChange(a),
        c.mode === 0 &&
          (Ze.flushSync(() => f.closeListbox()),
          (_ = c.buttonElement) == null || _.focus({ preventScroll: !0 }))
    }),
    v = j(() => {
      if (u) return f.goToOption(Oe.Nothing)
      f.goToOption(Oe.Specific, l)
    }),
    h = t1(),
    p = j(z => {
      h.update(z), !u && (o || f.goToOption(Oe.Specific, l, 0))
    }),
    b = j(z => {
      h.wasMoved(z) && (u || o || f.goToOption(Oe.Specific, l, 0))
    }),
    S = j(z => {
      h.wasMoved(z) && (u || (o && f.goToOption(Oe.Nothing)))
    }),
    A = d.useMemo(
      () => ({ active: o, focus: o, selected: g, disabled: u, selectedOption: g && r }),
      [o, g, u, r]
    ),
    O = r
      ? {}
      : {
          'id': l,
          'ref': E,
          'role': 'option',
          'tabIndex': u === !0 ? void 0 : -1,
          'aria-disabled': u === !0 ? !0 : void 0,
          'aria-selected': g,
          'disabled': void 0,
          'onClick': x,
          'onFocus': v,
          'onPointerEnter': p,
          'onMouseEnter': p,
          'onPointerMove': b,
          'onMouseMove': b,
          'onPointerLeave': S,
          'onMouseLeave': S
        },
    M = be()
  return !g && r
    ? null
    : M({ ourProps: O, theirProps: i, slot: A, defaultTag: CS, name: 'Listbox.Option' })
}
let zS = d.Fragment
function HS(e, t) {
  let { options: n, placeholder: l, ...u } = e,
    a = { ref: He(t) },
    i = Ra('ListboxSelectedOption'),
    r = d.useMemo(() => ({}), []),
    c =
      i.value === void 0 ||
      i.value === null ||
      (i.mode === 1 && Array.isArray(i.value) && i.value.length === 0),
    f = be()
  return N.createElement(
    $v.Provider,
    { value: !0 },
    f({
      ourProps: a,
      theirProps: { ...u, children: N.createElement(N.Fragment, null, l && c ? l : n) },
      slot: r,
      defaultTag: zS,
      name: 'ListboxSelectedOption'
    })
  )
}
let LS = ge(wS),
  Yv = ge(RS),
  US = Qg,
  Gv = ge(_S),
  Xv = ge(NS),
  jS = ge(HS),
  qS = Object.assign(LS, { Button: Yv, Label: US, Options: Gv, Option: Xv, SelectedOption: jS }),
  Mo = d.createContext(null)
Mo.displayName = 'GroupContext'
let BS = d.Fragment
function $S(e) {
  var t
  let [n, l] = d.useState(null),
    [u, a] = Xg(),
    [i, r] = $g(),
    c = d.useMemo(() => ({ switch: n, setSwitch: l }), [n, l]),
    f = {},
    o = e,
    g = be()
  return N.createElement(
    r,
    { name: 'Switch.Description', value: i },
    N.createElement(
      a,
      {
        name: 'Switch.Label',
        value: u,
        props: {
          htmlFor: (t = c.switch) == null ? void 0 : t.id,
          onClick(m) {
            n &&
              (m.currentTarget instanceof HTMLLabelElement && m.preventDefault(),
              n.click(),
              n.focus({ preventScroll: !0 }))
          }
        }
      },
      N.createElement(
        Mo.Provider,
        { value: c },
        g({ ourProps: f, theirProps: o, slot: {}, defaultTag: BS, name: 'Switch.Group' })
      )
    )
  )
}
let YS = 'button'
function GS(e, t) {
  var n
  let l = d.useId(),
    u = go(),
    a = lr(),
    {
      id: i = u || `headlessui-switch-${l}`,
      disabled: r = a || !1,
      checked: c,
      defaultChecked: f,
      onChange: o,
      name: g,
      value: m,
      form: s,
      autoFocus: y = !1,
      ...E
    } = e,
    x = d.useContext(Mo),
    [v, h] = d.useState(null),
    p = d.useRef(null),
    b = He(p, t, x === null ? null : x.setSwitch, h),
    S = _g(f),
    [A, O] = Dg(c, o, S ?? !1),
    M = tn(),
    [z, _] = d.useState(!1),
    D = j(() => {
      _(!0),
        O == null || O(!A),
        M.nextFrame(() => {
          _(!1)
        })
    }),
    k = j(Le => {
      if (Ug(Le.currentTarget)) return Le.preventDefault()
      Le.preventDefault(), D()
    }),
    K = j(Le => {
      Le.key === he.Space ? (Le.preventDefault(), D()) : Le.key === he.Enter && Hg(Le.currentTarget)
    }),
    V = j(Le => Le.preventDefault()),
    ae = vo(),
    R = Bg(),
    { isFocusVisible: H, focusProps: C } = Ag({ autoFocus: y }),
    { isHovered: L, hoverProps: q } = wg({ isDisabled: r }),
    { pressed: X, pressProps: Ee } = Rg({ disabled: r }),
    U = d.useMemo(
      () => ({ checked: A, disabled: r, hover: L, focus: H, active: X, autofocus: y, changing: z }),
      [A, L, H, X, r, z, y]
    ),
    I = ho(
      {
        'id': i,
        'ref': b,
        'role': 'switch',
        'type': nv(e, v),
        'tabIndex': e.tabIndex === -1 ? 0 : (n = e.tabIndex) != null ? n : 0,
        'aria-checked': A,
        'aria-labelledby': ae,
        'aria-describedby': R,
        'disabled': r || void 0,
        'autoFocus': y,
        'onClick': k,
        'onKeyUp': K,
        'onKeyPress': V
      },
      C,
      q,
      Ee
    ),
    Se = d.useCallback(() => {
      if (S !== void 0) return O == null ? void 0 : O(S)
    }, [O, S]),
    Hn = be()
  return N.createElement(
    N.Fragment,
    null,
    g != null &&
      N.createElement(Lg, {
        disabled: r,
        data: { [g]: m || 'on' },
        overrides: { type: 'checkbox', checked: A },
        form: s,
        onReset: Se
      }),
    Hn({ ourProps: I, theirProps: E, slot: U, defaultTag: YS, name: 'Switch' })
  )
}
let XS = ge(GS),
  Qv = $S,
  Vv = Qg,
  QS = Yg,
  VS = Object.assign(XS, { Group: Qv, Label: Vv, Description: QS })
function ZS({ title: e, titleId: t, ...n }, l) {
  return d.createElement(
    'svg',
    Object.assign(
      {
        'xmlns': 'http://www.w3.org/2000/svg',
        'viewBox': '0 0 16 16',
        'fill': 'currentColor',
        'aria-hidden': 'true',
        'data-slot': 'icon',
        'ref': l,
        'aria-labelledby': t
      },
      n
    ),
    e ? d.createElement('title', { id: t }, e) : null,
    d.createElement('path', {
      fillRule: 'evenodd',
      d: 'M5.22 10.22a.75.75 0 0 1 1.06 0L8 11.94l1.72-1.72a.75.75 0 1 1 1.06 1.06l-2.25 2.25a.75.75 0 0 1-1.06 0l-2.25-2.25a.75.75 0 0 1 0-1.06ZM10.78 5.78a.75.75 0 0 1-1.06 0L8 4.06 6.28 5.78a.75.75 0 0 1-1.06-1.06l2.25-2.25a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06Z',
      clipRule: 'evenodd'
    })
  )
}
const kS = d.forwardRef(ZS)
function FS({ title: e, titleId: t, ...n }, l) {
  return d.createElement(
    'svg',
    Object.assign(
      {
        'xmlns': 'http://www.w3.org/2000/svg',
        'viewBox': '0 0 20 20',
        'fill': 'currentColor',
        'aria-hidden': 'true',
        'data-slot': 'icon',
        'ref': l,
        'aria-labelledby': t
      },
      n
    ),
    e ? d.createElement('title', { id: t }, e) : null,
    d.createElement('path', {
      fillRule: 'evenodd',
      d: 'M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z',
      clipRule: 'evenodd'
    })
  )
}
const KS = d.forwardRef(FS)
function xd({ name: e, value: t, options: n, onChange: l }) {
  const u = a => {
    l({ target: { name: e, value: a } })
  }
  return w.jsx('div', {
    className: 'relative mt-1',
    children: w.jsxs(qS, {
      value: t,
      onChange: u,
      children: [
        w.jsxs(Yv, {
          className:
            'grid w-full cursor-default grid-cols-1 bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500 sm:text-sm/6',
          children: [
            w.jsx('span', {
              className: 'col-start-1 row-start-1 flex items-center gap-3 p-px pr-6',
              children: w.jsx('span', { className: 'block truncate text-base', children: t })
            }),
            w.jsx(kS, {
              'aria-hidden': 'true',
              'className':
                'col-start-1 row-start-1 size-6 self-center justify-self-end text-gray-500 sm:size-4'
            })
          ]
        }),
        w.jsx(Gv, {
          transition: !0,
          className:
            'absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base ring-1 shadow-lg ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm',
          children: n.map(a =>
            w.jsxs(
              Xv,
              {
                value: a,
                className:
                  'group relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none hover:bg-indigo-600 hover:text-white hover:outline-hidden',
                children: [
                  w.jsx('div', {
                    className: 'flex items-center',
                    children: w.jsx('span', {
                      className:
                        'ml-3 block truncate font-medium group-data-selected:font-semibold',
                      children: a
                    })
                  }),
                  a == t &&
                    w.jsx('span', {
                      className:
                        'absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-not-data-selected:hidden group-data-focus:text-white',
                      children: w.jsx(KS, { 'aria-hidden': 'true', 'className': 'size-5' })
                    })
                ]
              },
              a
            )
          )
        })
      ]
    })
  })
}
function JS({
  visible: e,
  title: t,
  icon: n,
  conformText: l,
  onConfirm: u,
  onClose: a,
  children: i
}) {
  return w.jsxs(hS, {
    open: e,
    onClose: a,
    className: 'relative z-10',
    children: [
      w.jsx(mS, {
        transition: !0,
        className:
          'fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in'
      }),
      w.jsx('div', {
        className: 'fixed inset-0 z-10 w-screen overflow-y-auto',
        children: w.jsx('div', {
          className:
            'flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0',
          children: w.jsxs(qv, {
            transition: !0,
            className:
              'relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95',
            children: [
              w.jsx('div', {
                className: 'bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4',
                children: w.jsxs('div', {
                  className: 'sm:flex sm:items-start',
                  children: [
                    w.jsx('div', {
                      className:
                        'mx-auto flex size-48 shrink-0 bg-blue-200 items-center justify-center rounded-full sm:mx-0 sm:size-10',
                      children: n
                    }),
                    w.jsxs('div', {
                      className: 'mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left',
                      children: [
                        w.jsx(Bv, {
                          as: 'h3',
                          className: 'text-base font-semibold text-gray-900',
                          children: t
                        }),
                        w.jsx('div', {
                          className: 'mt-2',
                          children: w.jsx('div', {
                            className:
                              'text-sm text-gray-500 whitespace-pre-wrap break-words max-w-96',
                            children: i
                          })
                        })
                      ]
                    })
                  ]
                })
              }),
              w.jsxs('div', {
                className: 'bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6',
                children: [
                  l &&
                    w.jsx('button', {
                      type: 'button',
                      onClick: u,
                      className:
                        'inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto',
                      children: l
                    }),
                  w.jsx('button', {
                    'type': 'button',
                    'data-autofocus': !0,
                    'onClick': a,
                    'className':
                      'mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto',
                    'children': '关闭'
                  })
                ]
              })
            ]
          })
        })
      })
    ]
  })
}
function WS({ title: e, titleId: t, ...n }, l) {
  return d.createElement(
    'svg',
    Object.assign(
      {
        'xmlns': 'http://www.w3.org/2000/svg',
        'fill': 'none',
        'viewBox': '0 0 24 24',
        'strokeWidth': 1.5,
        'stroke': 'currentColor',
        'aria-hidden': 'true',
        'data-slot': 'icon',
        'ref': l,
        'aria-labelledby': t
      },
      n
    ),
    e ? d.createElement('title', { id: t }, e) : null,
    d.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
    })
  )
}
const PS = d.forwardRef(WS)
function IS({ title: e, titleId: t, ...n }, l) {
  return d.createElement(
    'svg',
    Object.assign(
      {
        'xmlns': 'http://www.w3.org/2000/svg',
        'fill': 'none',
        'viewBox': '0 0 24 24',
        'strokeWidth': 1.5,
        'stroke': 'currentColor',
        'aria-hidden': 'true',
        'data-slot': 'icon',
        'ref': l,
        'aria-labelledby': t
      },
      n
    ),
    e ? d.createElement('title', { id: t }, e) : null,
    d.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88'
    })
  )
}
const e2 = d.forwardRef(IS)
function t2({ title: e, titleId: t, ...n }, l) {
  return d.createElement(
    'svg',
    Object.assign(
      {
        'xmlns': 'http://www.w3.org/2000/svg',
        'fill': 'none',
        'viewBox': '0 0 24 24',
        'strokeWidth': 1.5,
        'stroke': 'currentColor',
        'aria-hidden': 'true',
        'data-slot': 'icon',
        'ref': l,
        'aria-labelledby': t
      },
      n
    ),
    e ? d.createElement('title', { id: t }, e) : null,
    d.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z'
    }),
    d.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'
    })
  )
}
const n2 = d.forwardRef(t2)
function l2({ title: e, titleId: t, ...n }, l) {
  return d.createElement(
    'svg',
    Object.assign(
      {
        'xmlns': 'http://www.w3.org/2000/svg',
        'fill': 'none',
        'viewBox': '0 0 24 24',
        'strokeWidth': 1.5,
        'stroke': 'currentColor',
        'aria-hidden': 'true',
        'data-slot': 'icon',
        'ref': l,
        'aria-labelledby': t
      },
      n
    ),
    e ? d.createElement('title', { id: t }, e) : null,
    d.createElement('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z'
    })
  )
}
const u2 = d.forwardRef(l2)
function a2({ name: e, placeholder: t, value: n, onChange: l }) {
  const [u, a] = d.useState(!1)
  return w.jsxs('div', {
    className:
      'mt-1 flex items-center rounded-md w-full border border-gray-300 has-[input:focus-within]:outline-none has-[input:focus-within]:ring has-[input:focus-within]:ring-blue-500',
    children: [
      w.jsx('input', {
        id: e,
        name: e,
        type: u ? 'text' : 'password',
        placeholder: t,
        value: n,
        onChange: l,
        className: 'ml-1 block w-full p-2 pl-1'
      }),
      w.jsx('div', {
        className: 'shrink-0 select-none text-base text-gray-500 sm:text-sm/6 mr-2 ml-2',
        children: u
          ? w.jsx(n2, { className: 'size-5', onClick: () => a(!1) })
          : w.jsx(e2, { className: 'size-5', onClick: () => a(!0) })
      })
    ]
  })
}
const i2 = d.forwardRef(
  ({ cd: e, disabledOnWait: t, onClick: n, onChildren: l, children: u, style: a }, i) => {
    const r = { enable: !1, cd: e || 0 },
      [c, f] = d.useState(r),
      o = d.useRef(void 0),
      g = () => {
        e
          ? c.enable
            ? (clearInterval(o.current), f(r))
            : (f({ ...c, enable: !0 }),
              (o.current = setInterval(() => {
                f(m => (m.cd <= 1 ? (clearInterval(o.current), r) : { enable: !0, cd: m.cd - 1 }))
              }, 1e3)),
              n())
          : n()
      }
    return (
      d.useImperativeHandle(i, () => ({
        clearInterval() {
          clearInterval(o.current), f(r)
        }
      })),
      w.jsxs('button', {
        disabled: c.enable && (t || !1),
        type: 'button',
        className:
          'w-full flex justify-center items-center bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200',
        style: { backgroundColor: c.enable ? 'rgb(29 78 216 / 0.8' : void 0, ...a },
        onClick: g,
        children: [l && l(c.enable, c.cd), u]
      })
    )
  }
)
function Td({ value: e, desc: t, onChange: n }) {
  return w.jsx('div', {
    className: 'flex gap-x-4 sm:col-span-2 mt-1.5',
    children: w.jsxs(Qv, {
      children: [
        w.jsxs('div', {
          className: 'flex h-6 items-center',
          children: [
            w.jsx(VS, {
              checked: e,
              onChange: n,
              style: { padding: '2px' },
              className: [
                e ? 'bg-blue-600' : 'bg-gray-200',
                'flex items-center w-10 cursor-pointer rounded-full ring-1 ring-inset ring-gray-900/5 transition-colors duration-200 ease-in-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              ].join(' '),
              children: w.jsx('span', {
                'aria-hidden': 'true',
                'className': [
                  e ? 'translate-x-4' : 'translate-x-0',
                  'size-5 transform rounded-full bg-white shadow-sm ring-1 ring-gray-900/5 transition duration-200 ease-in-out'
                ].join(' ')
              })
            }),
            w.jsx('span', { className: 'sr-only', children: 'Agree to policies' })
          ]
        }),
        w.jsx(Vv, { className: 'text-sm text-gray-600', children: t })
      ]
    })
  })
}
function r2({ name: e, value: t, options: n, onChange: l }) {
  const [u, a] = d.useState(t)
  return w.jsx('div', {
    className: 'flex flex-col',
    children: n.map((i, r) =>
      w.jsxs(
        'label',
        {
          className: 'inline-flex items-center',
          children: [
            w.jsx('input', {
              type: 'radio',
              name: e,
              checked: u == r,
              onChange: () => (a(r), l && l(r)),
              className: 'mr-2'
            }),
            i
          ]
        },
        i
      )
    )
  })
}
class c2 {
  upload(t) {
    const n = Array.from(t).map(
      l =>
        new Promise((u, a) => {
          const i = new FileReader(),
            { name: r, size: c } = l
          ;(i.onload = f => {
            const o = f.target.result,
              g = new Uint8Array(o),
              m = btoa(String.fromCharCode(...g))
            u({ name: r, size: c, data: m })
          }),
            (i.onerror = f => {
              var o
              a((o = f.target.error) == null ? void 0 : o.stack)
            }),
            i.readAsArrayBuffer(l)
        })
    )
    return Promise.all(n)
  }
  download(t) {
    t.forEach(n => {
      const l = n.data,
        u = Uint8Array.from(atob(l), c => c.charCodeAt(0)),
        a = new Blob([u], { type: 'text/plain' }),
        i = URL.createObjectURL(a),
        r = document.createElement('a')
      ;(r.href = i),
        (r.download = n.name),
        document.body.appendChild(r),
        r.click(),
        document.body.removeChild(r),
        URL.revokeObjectURL(i)
    })
  }
}
const Od = new c2()
function f2() {
  const e = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'mark', 'off'],
    t = ['1.安卓手机', '2.aPad', '3.安卓手表', '4.MacOS', '5.iPad', '6.Tim'],
    [n, l] = d.useState({
      qq: '',
      password: '',
      device: '2',
      sign_api_addr: 'https://qsign-guide.trpgbot.com/?key=0852369',
      ver: '9.0.90',
      master_key: '',
      log_level: 'info',
      ignore_self: !0,
      resend: !0,
      reconn_interval: 5,
      cache_group_member: !0,
      ffmpeg_path: '',
      ffprobe_path: ''
    }),
    u = {
      open: !1,
      type: 'text',
      title: '',
      desc: '',
      img: '',
      url: '',
      value: 0,
      options: [''],
      confirm_text: '确认'
    },
    [a, i] = d.useState(u),
    [r, c] = d.useState(!1),
    f = d.useRef(null),
    o = d.useRef(null),
    g = v => {
      const { name: h, value: p } = v.target
      l({ ...n, [h]: p })
    },
    m = v => {
      v.preventDefault(), window.API.postMessage({ type: 'qq.form.save', data: n })
    },
    s = d.useRef(v => {
      i({ ...u, open: !1 })
    }),
    y = v => {
      r
        ? window.API.postMessage({ type: 'qq.offline', data: !0 })
        : window.API.postMessage({ type: 'qq.login', data: n })
    },
    E = () => {
      window.API.postMessage({ type: 'qq.files.list.icqq', data: n.qq ?? '' })
    },
    x = async v => {
      if (v.target.files)
        try {
          const h = await Od.upload(v.target.files)
          window.API.postMessage({ type: 'qq.files.upload', data: h })
        } catch (h) {
          i({
            ...u,
            title: '上传失败！',
            type: 'text',
            desc: h.stack ?? h.message,
            confirm_text: '',
            open: !0
          })
        }
    }
  return (
    window.addEventListener('message', v => {
      var h
      ;(h = v.data) != null &&
        h.ticket &&
        (i({
          ...u,
          title: '捕获到ticket，正在尝试登录...',
          type: 'text',
          desc: v.data.ticket,
          confirm_text: '',
          open: !0
        }),
        window.API.postMessage({ type: 'qq.login.ticket', data: v.data.ticket }))
    }),
    d.useEffect(() => {
      if (!window.createDesktopAPI) return
      const v = window.createDesktopAPI()
      return (
        (window.API = v),
        v.postMessage({ type: 'qq.init', data: '' }),
        v.onMessage(h => {
          const p = h == null ? void 0 : h.data
          switch (h.type) {
            case 'qq.init': {
              l({
                ...p,
                master_key: Array.isArray(p == null ? void 0 : p.master_key)
                  ? p.master_key.join(',')
                  : ''
              })
              break
            }
            case 'qq.online': {
              c(p)
              break
            }
            case 'qq.login.qrcode': {
              o.current.clearInterval(),
                i({
                  ...u,
                  title: '请用该账号设备扫码',
                  type: 'qrcode',
                  img: `data:image/png;base64,${p}`,
                  confirm_text: '扫码后确认',
                  open: !0
                }),
                (s.current = () => {
                  v.postMessage({ type: 'qq.login.qrcode.scaned', data: '' })
                })
              break
            }
            case 'qq.login.qrcode.expired': {
              i({ ...u, title: p, type: 'text', desc: '', confirm_text: '', open: !0 })
              break
            }
            case 'qq.login.slider': {
              o.current.clearInterval(),
                i({
                  ...u,
                  title: '请完成图形自动验证：',
                  type: 'iframe',
                  url: p,
                  confirm_text: '尝试手动验证',
                  open: !0
                }),
                (s.current = () => {
                  i({
                    ...u,
                    title: '手动获取ticket',
                    type: 'text,input',
                    desc: `请用验证App
[https://wwp.lanzouy.com/i6w3J08um92h][3kuu]
或网页控制台手动抓取ticket：
${new URLSearchParams(new URL(p).search).get('url')}
并填写到输入框确认：`,
                    value: '',
                    confirm_text: '确认',
                    open: !0
                  }),
                    (s.current = b => {
                      i({
                        ...u,
                        title: '正在提交ticket验证，请稍等...',
                        confirm_text: '',
                        open: !0
                      }),
                        window.API.postMessage({ type: 'qq.login.ticket', data: b.value })
                    })
                })
              break
            }
            case 'qq.device.validate': {
              o.current.clearInterval(),
                i({ ...u, type: 'radios', title: p.msg, value: 1, options: p.choices, open: !0 }),
                (s.current = b => {
                  if (b.value == 0) {
                    i({
                      ...u,
                      title: '请完成验证：',
                      type: 'iframe',
                      url: p.url,
                      confirm_text: '确定',
                      open: !0
                    }),
                      (s.current = () => {
                        i({ ...u, title: '正尝试登录，请稍等...', confirm_text: '', open: !0 }),
                          v.postMessage({
                            type: 'qq.device.validate.choice',
                            data: { choice: b.value, url: p.url, phone: p.phone }
                          })
                      })
                    return
                  }
                  v.postMessage({
                    type: 'qq.device.validate.choice',
                    data: { choice: b.value, url: p.url, phone: p.phone }
                  })
                })
              break
            }
            case 'qq.smscode.send': {
              o.current.clearInterval(),
                i({
                  ...u,
                  title: `已向 ${p} 发送验证码，请填写：`,
                  type: 'input',
                  value: '',
                  confirm_text: '确认',
                  open: !0
                }),
                (s.current = b => {
                  i({ ...u, title: `提交验证码[${b.value}]，请稍等...`, confirm_text: '' }),
                    v.postMessage({ type: 'qq.smscode', data: b.value })
                })
              break
            }
            case 'qq.smscode.received': {
              o.current.clearInterval(),
                i({
                  ...u,
                  title: '正尝试验证登录，请稍等...',
                  type: 'text',
                  desc: '',
                  confirm_text: '',
                  open: !0
                })
              break
            }
            case 'qq.system.online': {
              i({ ...u, title: '登录成功！', type: 'text', desc: p, confirm_text: '', open: !0 }),
                c(!0)
              break
            }
            case 'qq.system.offline': {
              i({
                ...u,
                title: '@AlemonJS/QQ 下线！',
                type: 'text',
                desc: p,
                confirm_text: '退出进程',
                open: !0
              }),
                (s.current = () => {
                  window.API.postMessage({ type: 'qq.process.exit', data: '' })
                })
              break
            }
            case 'qq.files.upload.success': {
              i({ ...u, title: '上传成功！', type: 'text', desc: p, confirm_text: '', open: !0 })
              break
            }
            case 'qq.files.delete.list': {
              i({
                ...u,
                title: '您确定要删除以下文件吗?',
                type: 'text,radios',
                desc:
                  p == null
                    ? void 0
                    : p.map((b, S) => `${S + 1}: ${b.name} --${b.size}B`).join(`
`),
                value: 0,
                options: ['是的，我要删除', '不，我要下载'],
                confirm_text: '确定',
                open: !0
              }),
                (s.current = b => {
                  if (b.value == 0)
                    window.API.postMessage({ type: 'qq.files.delete.icqq', data: n.qq }), i(u)
                  else if (b.value == 1)
                    try {
                      Od.download(p), i(u)
                    } catch (S) {
                      i({
                        ...u,
                        title: '错误',
                        type: 'text',
                        desc: S.stack ?? S.message,
                        confirm_text: '',
                        open: !0
                      })
                    }
                })
              break
            }
            case 'qq.error': {
              o.current.clearInterval(),
                i({
                  ...u,
                  title: '错误',
                  type: 'text',
                  desc: p,
                  confirm_text: '退出进程',
                  open: !0
                }),
                (s.current = () => {
                  window.API.postMessage({ type: 'qq.process.exit', data: '' })
                })
              break
            }
          }
        }),
        () => {
          v.postMessage({ type: 'qq.desktop.unmount', data: '' })
        }
      )
    }, []),
    w.jsxs(w.Fragment, {
      children: [
        w.jsxs(JS, {
          title: a.title,
          visible: a.open,
          conformText: a.confirm_text,
          onConfirm: () => s.current(a),
          onClose: () => {
            i({ ...a, open: !1 })
          },
          icon: w.jsx(PS, { 'aria-hidden': 'true', 'className': 'size-6 text-blue-600' }),
          children: [
            /qrcode/.test(a.type) && w.jsx('img', { className: 'w-full', src: a.img }),
            /text/.test(a.type) &&
              w.jsx('pre', {
                className: 'mr-6 whitespace-pre-wrap break-words text-wrap',
                children: a.desc
              }),
            /html/.test(a.type) &&
              w.jsx('pre', {
                className: 'mr-6 whitespace-pre-wrap break-words text-wrap',
                children: w.jsx('span', { dangerouslySetInnerHTML: { __html: a.desc } })
              }),
            /iframe/.test(a.type) &&
              w.jsx('iframe', { ref: f, className: 'w-96 h-96', src: a.url }),
            /radios/.test(a.type) &&
              w.jsx(r2, {
                name: 'dev',
                value: a.value,
                options: a.options,
                onChange: v => i({ ...a, value: v })
              }),
            /input/.test(a.type) &&
              w.jsx('input', {
                type: 'text',
                name: 'sms',
                value: a.value,
                onChange: v => i({ ...a, value: v.target.value }),
                className:
                  'mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
              })
          ]
        }),
        w.jsxs('form', {
          id: 'qqForm',
          onSubmit: m,
          className: 'py-4 space-y-4',
          children: [
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'qq',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: 'QQ'
                }),
                w.jsx('input', {
                  type: 'text',
                  id: 'qq',
                  name: 'qq',
                  value: n.qq,
                  onChange: g,
                  className:
                    'mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'password',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: '密码'
                }),
                w.jsx(a2, {
                  name: 'password',
                  placeholder: '不填则使用扫码登录',
                  value: n.password,
                  onChange: g
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'device',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: '登录设备'
                }),
                w.jsx(xd, {
                  name: 'device',
                  value: t[Number(n.device) - 1],
                  options: t,
                  onChange: v =>
                    g({
                      target: {
                        name: 'device',
                        value: String(t.findIndex(h => v.target.value == h) + 1)
                      }
                    })
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'master_key',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: 'Master Key'
                }),
                w.jsx('input', {
                  type: 'text',
                  id: 'master_key',
                  name: 'master_key',
                  value: n.master_key,
                  placeholder: '12345,12345,1212121',
                  onChange: g,
                  className:
                    'mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'sign_api_addr',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: '签名地址'
                }),
                w.jsx('input', {
                  type: 'text',
                  id: 'sign_api_addr',
                  name: 'sign_api_addr',
                  value: n.sign_api_addr,
                  onChange: g,
                  className:
                    'mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'ver',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: '签名版本'
                }),
                w.jsx('input', {
                  type: 'text',
                  id: 'ver',
                  name: 'ver',
                  value: n.ver,
                  onChange: g,
                  className:
                    'mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'log_level',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: '日志等级'
                }),
                w.jsx(xd, {
                  name: 'log_level',
                  desc: '越靠前越详细',
                  value: n.log_level,
                  options: e,
                  onChange: v => g({ target: { name: 'log_level', value: v.target.value } })
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'ignore_self',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: '群聊和频道中是否过滤自己的消息'
                }),
                w.jsx(Td, {
                  value: n.ignore_self,
                  onChange: v => {
                    g({ target: { name: 'ignore_self', value: v, type: 'switch' } })
                  }
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'resend',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: '被风控时是否尝试用分片发送'
                }),
                w.jsx(Td, {
                  value: n.resend,
                  onChange: v => {
                    g({ target: { name: 'resend', value: v, type: 'switch' } })
                  }
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'reconn_interval',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: '掉线后的重新登录间隔秒数'
                }),
                w.jsx('input', {
                  type: 'number',
                  id: 'reconn_interval',
                  min: 0,
                  placeholder: '为0则不重连',
                  name: 'reconn_interval',
                  value: n.reconn_interval,
                  onChange: v =>
                    g({ target: { name: 'reconn_interval', value: Number(v.target.value) } }),
                  className:
                    'mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'ffmpeg_path',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: 'ffmepg路径'
                }),
                w.jsx('input', {
                  type: 'text',
                  id: 'ffmpeg_path',
                  name: 'ffmpeg_path',
                  placeholder: '绝对路径',
                  value: n.ffmpeg_path,
                  onChange: g,
                  className:
                    'mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'ffprobe_path',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: 'ffprobe路径'
                }),
                w.jsx('input', {
                  type: 'text',
                  id: 'ffprobe_path',
                  placeholder: '绝对路径',
                  name: 'ffprobe_path',
                  value: n.ffprobe_path,
                  onChange: g,
                  className:
                    'mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-500'
                })
              ]
            }),
            w.jsxs('div', {
              children: [
                w.jsx('label', {
                  htmlFor: 'port',
                  className: 'block text-sm font-semibold text-gray-700',
                  children: '上传Device和token'
                }),
                w.jsxs('div', {
                  className:
                    'mt-1 relative flex justify-center items-center w-full border border-gray-300 rounded-md has-[input:focus-within]:outline-none has-[input:focus-within]:ring has-[input:focus-within]:ring-blue-500',
                  children: [
                    w.jsx('input', {
                      type: 'file',
                      multiple: !0,
                      onChange: x,
                      className: 'w-full p-1 border border-gray-300 opacity-0'
                    }),
                    w.jsx('span', {
                      className: 'absolute text-gray-400 -z-10',
                      children: '如果已有，则会覆盖'
                    })
                  ]
                })
              ]
            }),
            w.jsx(i2, {
              cd: 20,
              ref: o,
              disabledOnWait: !0,
              onClick: y,
              onChildren: (v, h) =>
                w.jsxs(w.Fragment, {
                  children: [
                    v
                      ? w.jsxs('span', {
                          className: 'animate-pulse',
                          children: [h, ' years later']
                        })
                      : r
                      ? '点击下线'
                      : '登录',
                    v && w.jsx(u2, { className: 'text-white animate-spin size-6 ml-2' })
                  ]
                })
            }),
            w.jsxs('div', {
              className: 'flex justify-between items-center',
              children: [
                w.jsx('button', {
                  type: 'submit',
                  className:
                    'w-full mr-1 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200',
                  children: '保存配置'
                }),
                w.jsx('button', {
                  type: 'button',
                  className:
                    'w-full ml-1 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition duration-200',
                  onClick: E,
                  children: '删除device和token'
                })
              ]
            })
          ]
        })
      ]
    })
  )
}
function o2() {
  return w.jsx('div', {
    className: 'flex items-center justify-center p-8',
    children: w.jsxs('div', {
      className: '  rounded-lg p-8 shadow-inner w-full max-w-md',
      children: [
        w.jsx('div', { className: 'flex items-center justify-center mb-4', children: 'ICQQ' }),
        w.jsx(f2, {})
      ]
    })
  })
}
Zy.createRoot(document.getElementById('root')).render(w.jsx(o2, {}))
