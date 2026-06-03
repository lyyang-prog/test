// 你的 Teachable Machine 模型網址
const URL = "https://teachablemachine.withgoogle.com/models/t5_tFFFbI/";

let model, ctx, labelContainer, maxPredictions;
let video, canvas;
let score = 0;
let canScore = true; 

async function init() {
    document.getElementById("status").innerHTML = "正在喚醒 AI 大脑，請稍候...";
    
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        // 1. 載入 AI 模型
        model = await tmPose.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // 2. 獲取網頁上的相機與畫布元件
        video = document.getElementById("video");
        canvas = document.getElementById("canvas");
        ctx = canvas.getContext("2d");

        // 3. 【純原生做法】直接向 iPad 索取鏡頭，繞過官方工具包 Bug
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: 400, height: 400 },
            audio: false
        });
        
        video.srcObject = stream;
        video.play();

        labelContainer = document.getElementById("label-container");
        document.getElementById("status").innerHTML = "GAME START! 請對準鏡頭開始運動";
        
        // 4. 開始無限循環偵測
        window.requestAnimationFrame(loop);
    } catch (e) {
        document.getElementById("status").innerHTML = "❌ 啟動失敗：請確保已允許相機權限";
        console.error(e);
    }
}

async function loop(timestamp) {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // 把鏡頭畫面畫到畫布上
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 讓 AI 進行骨架預測
        const { pose, posenetOutput } = await model.estimatePose(video);
        const prediction = await model.predict(posenetOutput);

        let statusHTML = "";

        for (let i = 0; i < maxPredictions; i++) {
            const className = prediction[i].className;
            const probability = prediction[i].probability;
            
            // 顯示能量條
            statusHTML += `
                <div class="prediction-row">
                    <span class="class-name">${className}</span>
                    <span class="class-bar-bg">
                        <span class="class-bar-fill" style="width: ${(probability * 100)}%"></span>
                    </span>
                    <span class="class-pct">${(probability * 100).toFixed(0)}%</span>
                </div>
            `;

            // 計分邏輯：Class 3 大於 70% 且不在冷卻時間
            if (className === "Class 3" && probability > 0.70 && canScore) {
                score += 1; 
                document.getElementById("score-display").innerHTML = score;
                
                canScore = false;
                setTimeout(() => { canScore = true; }, 1000); // 1秒冷卻
            }
        }
        
        labelContainer.innerHTML = statusHTML;
        
        // 畫出藍綠色骨架線條
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
    window.requestAnimationFrame(loop);
}
