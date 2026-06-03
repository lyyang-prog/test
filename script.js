// 保留你最新的 Teachable Machine 模型網址
const URL = "https://teachablemachine.withgoogle.com/models/t5_tFFFbI/";

let model, webcam, ctx, labelContainer, maxPredictions;
let score = 0;
let canScore = true; // 防重複加分的計時開關

async function init() {
    const statusDiv = document.getElementById("status");
    statusDiv.innerText = "正在啟動攝像頭...";

    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        const size = 400;
        const flip = true; 
        webcam = new tmPose.Webcam(size, size, flip); 
        
        // 請求 iPad 前鏡頭權限
        await webcam.setup({ facingMode: "user" }); 
        
        // 強制解鎖 iOS/iPad 播放機制
        if (webcam.webcam) {
            webcam.webcam.setAttribute('playsinline', true);
            webcam.webcam.setAttribute('muted', true);
            webcam.webcam.muted = true;
        }
        
        await webcam.play();
        statusDiv.innerText = "相機已就緒，正在加載模型...";

        // 加載你原本的 AI 模型
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 設定畫布
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
    webcam.update(); 
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    if (pose) {
        drawPose(pose);
    }

    // 1. 動態渲染能量條，讓你看得到你的 Class 1、Class 2、Class 3 百分比
    let statusHTML = "";
    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = prediction[i].probability;

        statusHTML += `
            <div class="prediction-row">
                <span class="class-name">${className}</span>
                <span class="class-bar-bg">
                    <span class="class-bar-fill" style="width: ${(probability * 100)}%"></span>
                </span>
                <span class="class-pct">${(probability * 100).toFixed(0)}%</span>
            </div>
        `;

        // 2. 【Class 3 的專屬得分邏輯】
        // 當偵測到名稱完全等於 "Class 3"、機率 > 70%，且目前不在 1 秒冷卻時間內
        if (className === "Class 3" && probability > 0.70 && canScore) {
            score += 1; 
            document.getElementById("score-display").innerText = score; // 完美對齊你的霓虹計分板
            
            // 進入 1 秒冷卻，防止動作維持時分數瘋狂連加
            canScore = false;
            setTimeout(() => { canScore = true; }, 1000); 
        }
    }
    document.getElementById("label-container").innerHTML = statusHTML;
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }";

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
