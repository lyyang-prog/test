// 1. 沿用你的最新 Pose 模型網址
const URL = "https://teachablemachine.withgoogle.com/models/_qNCgNZbP/";

let model, webcam, ctx, maxPredictions;
let score = 0;

// 計時器：用來控制手舉著時，每隔多久跳一次分
let scoreTimer = null; 
let isHandUpNow = false; 

// 運動激勵語錄庫
const motivationalQuotes = [
    "加油！把手高高舉起！ 🙌",
    "再伸展多一點，你可以的！ 🔥",
    "運動讓大腦更清醒，繼續衝！ ⚡",
    "手舉得越高，能量就滿滿！ 💪",
    "堅持住！能量正在瘋狂集氣！ 🚀"
];

async function init() {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = "正在啟動 iPad 攝像頭...";

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        const size = 400;
        const flip = true; 
        
        webcam = new tmPose.Webcam(size, size, flip); 
        
        await webcam.setup(); 
        await webcam.play();
        
        statusDiv.innerText = "相機就緒，正在加載 AI 模型...";

        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        const canvas = document.getElementById("canvas");
        canvas.width = size;
        canvas.height = size;
        ctx = canvas.getContext("2d");

        statusDiv.innerText = "偵測中... 請開始運動！";
        document.getElementById("label-container").innerText = "把手舉高，開始集氣！🔥";
        window.requestAnimationFrame(loop);
    } catch (e) {
        console.error(e);
        statusDiv.innerText = "錯誤: 無法開啟相機或載入模型。";
    }
}

async function loop(timestamp) {
    if (webcam) {
        webcam.update(); 
        await predict();
    }
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    if (pose) {
        drawPose(pose);
    }

    // 只抓取 handup 的機率
    let handupProbability = 0;
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].className === "handup") {
            handupProbability = prediction[i].probability;
        }
    }

    const labelContainer = document.getElementById("label-container");

    // --- 🛠️ 核心改造：無限集氣跳分邏輯 ---
    if (handupProbability >= 0.70) {
        labelContainer.innerHTML = "⚡
