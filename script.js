// 自動為你保留之前截圖中可通電的 Teachable Machine 網址
const URL = "https://teachablemachine.withgoogle.com/models/t5_tFFFbI/";

let model, webcam, ctx, labelContainer, maxPredictions;
let score = 0;
let canScore = true; // 防重複加分的計時開關

async function init() {
    document.getElementById("status").innerHTML = "正在喚醒 AI 大脑，請稍候...";
    
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // 1. 載入 Teachable Machine 模型
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 2. 設定相機尺寸
        const size = 400;
        const flip = true; 
        
        // 3. 初始化相機並強制指定前鏡頭 (面向使用者)
        webcam = new tmPose.Webcam(size, size, flip);
        await webcam.setup({ facingMode: "user" }); 
        
        // 核心修正：強制解鎖 iPad/iOS 的鏡頭自動播放限制，防止黑畫面與凍結
        if (webcam.webcam) {
            webcam.webcam.setAttribute('playsinline', true);
            webcam.webcam.setAttribute('muted', true);
            webcam.webcam.muted = true;
        }

        // 4. 啟動相機並開始迴圈偵測
        await webcam.play();
        window.requestAnimationFrame(loop);

        // 5. 初始化網頁上的畫布 (Canvas)
        const canvas = document.getElementById("canvas");
        canvas.width = size; 
        canvas.height = size;
        ctx = canvas.getContext("2d");
        
        labelContainer = document.getElementById("label-container");
        document.getElementById("status").innerHTML = "GAME START! 請對準鏡頭開始運動";
    } catch (e) {
        document.getElementById("status").innerHTML = "❌ 啟動失敗：請確保網址為 https 開頭，且已在無痕模式允許相機權限";
        console.error(e);
    }
}

async function loop(timestamp) {
    webcam.update(); // 更新相機畫面
    await predict(); // 讓 AI 進行預測
    window.requestAnimationFrame(loop);
}

async function predict() {
    // 讓 AI 估算骨架與動態
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    let statusHTML = "";

    for (let i = 0; i < maxPredictions; i++) {
        const className = prediction[i].className;
        const probability = prediction[i].probability;
        
        // 建立下方能量條與百分比數據的網頁樣式
        statusHTML += `
            <div class="prediction-row">
                <span class="class-name">${className}</span>
                <span class="class-bar-bg">
                    <span class="class-bar-fill" style="width: ${(probability * 100)}%"></span>
                </span>
                <span class="class-pct">${(probability * 100).toFixed(0)}%</span>
            </div>
        `;

        // 核心得分邏輯：當偵測到 "Class 3" 且機率高於 70% (0.70)
        if (className === "Class 3" && probability > 0.70 && canScore) {
            score += 1; 
            document.getElementById("score-display").innerHTML = score;
            
            // 觸發 1 秒鐘冷卻時間，防止因為動作維持住而導致分數瘋狂連加
            canScore = false;
            setTimeout(() => { canScore = true; }, 1000); 
        }
    }
    
    labelContainer.innerHTML = statusHTML;
    drawPose(pose);
}

// 在網頁畫布上畫出即時相機畫面與 AI 藍綠色骨架
function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}
