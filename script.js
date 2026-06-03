// 保留你最新的 Teachable Machine 模型網址
const URL = "https://teachablemachine.withgoogle.com/models/bIbkK6h2o/";

let model, webcam, ctx, labelContainer, maxPredictions;
let count = 0;
let lastStatus = "down"; // 狀態追蹤

async function init() {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = "正在啟動攝像頭...";

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // 1. 設定攝像頭參數
        const size = 400;
        const flip = true; 
        webcam = new tmPose.Webcam(size, size, flip); 
        
        // 2. 【核心修正】請求相機權限，強制指定 iPad 的前鏡頭 (facingMode: "user")
        await webcam.setup({ facingMode: "user" }); 
        
        // 3. 【關鍵破解】直接侵入底層影片元件，強行塞入 iPad 必備的防凍結、靜音播放屬性
        if (webcam.webcam) {
            webcam.webcam.setAttribute('playsinline', true);
            webcam.webcam.setAttribute('muted', true);
            webcam.webcam.muted = true;
        }
        
        // 4. 啟動相機
        await webcam.play();
        
        statusDiv.innerText = "相機已就緒，正在加載模型...";

        // 5. 加載 AI 模型
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 6. 設定畫布
        const canvas = document.getElementById("canvas");
        canvas.width = size;
        canvas.height = size;
        ctx = canvas.getContext("2d");

        statusDiv.innerText = "偵測中... 請開始動作！";
        window.requestAnimationFrame(loop);
    } catch (e) {
        console.error(e);
        statusDiv.innerText = "錯誤: 無法開啟相機或載入模型。";
    }
}

async function loop(timestamp) {
    webcam.update(); // 更新相機畫面
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // 執行預測
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    // 繪製骨架點
    if (pose) {
        draw
