<script>
createApp({
    setup: () => {
        const { ref, onMounted } = Vue;
        const origin = ref('')
        onMounted(() => {
            origin.value = window.location.origin
        })
        const url = ref('/index.vue')
        const jsonData = ref(JSON.stringify(BOT_DATA ?? "{}"))
        const open = () => {
            let db = ''
            try {
                db = `data=${JSON.stringify(JSON.parse(jsonData.value))}`
            } catch {
                console.error('json err')
            }
            const openURl = `${origin.value}${url.value}?${db}`
            console.log('openURl', openURl)
            window.open(openURl)
        }
        function formatJson() {
            try {
                jsonData.value = JSON.stringify(jsonlint.parse(jsonData.value), null, 2)
            } catch (error) {
                alert('无效的 JSON 格式')
            }

        }
        return {
            formatJson,
            origin,
            url,
            open,
            jsonData,
            ...BOT_DATA,
        }
    }
}).mount('#app');


</script>

<template>
    <div style="padding: 1em;">
        <div style="padding: 1em;display:grid;">
            <div
                style="margin: auto;;border-radius: 20px;font-weight: 600;padding: 1rem;background-color: rgb(50, 162, 227);color: #ffffff;">
                机器人渲染模拟器
            </div>
        </div>
        <div style="padding: 3rm;">
        </div>
        <div
            style="border-radius: 20px;background-color: rgb(95, 183, 234);display: grid;grid-template-columns: repeat(2, 35% 65%);">
            <div style="width: 100%;">
                <div style="padding: 1rem;">
                    <div style="padding: 1rem;">{{ origin }}</div>
                    <input style="padding: 1rem;" v-model="url" type="text" placeholder="/index.vue">
                    <div style="padding: 1rem;;display: grid;grid-template-columns:repeat(2,50%);">
                        <div>
                            <button @click="open" style="border-radius:12px;padding: 8px;">
                                预览效果
                            </button>
                        </div>
                        <div>
                            <button @click="formatJson" style="border-radius:12px;padding: 8px;">
                                格式化数据
                            </button>
                        </div>
                    </div>
                </div>
                <div style="padding: 3rm;">
                </div>
            </div>
            <div style="width: 100%;">
                <div style="padding: 1rem;">
                    <div style="padding: 1rem;text-align: center;">数据对象</div>
                    <textarea style="width: 100%;min-height: 600px;" id="formattedJson" v-model="jsonData"></textarea>
                </div>
            </div>
        </div>
    </div>
</template>

<head>
    <script async src="https://cdnjs.cloudflare.com/ajax/libs/jsonlint/1.6.0/jsonlint.min.js"></script>
</head>

