// --- 遊戲設定與變數 ---
const modelURL = 'https://teachablemachine.withgoogle.com/models/_qNCgNZbP/';
let video;
let classifier;
let label = "模型載入中...";
let confidence = 0.0;
let score = 0;
let feedbackText = "點擊畫面任意處以啟動鏡頭與 AI 🚀";
let isGameStarted = false; // iPad iOS 觸發鎖
let hasScoredThisTime = false; 

// 運動激勵語錄
const motivationalQuotes = [
    "加油！把手高高舉起！ 🙌",
    "再伸展多一點，你可以的！ 🔥",
    "運動讓大腦更清醒，繼續衝！ ⚡",
    "手舉得越高，能量就滿滿！ 💪",
    "堅持住！下一分馬上就到！ 🚀"
];

function preload() {
    // 載入 Teachable Machine 模型
    classifier = ml5.imageClassifier(modelURL + 'model.json');
}

function setup() {
    // 配合 iPad 螢幕比例 (4:3)
    let canvasWidth = windowWidth > 640 ? 640 : windowWidth - 20;
    let canvasHeight = canvasWidth * (3 / 4);
    
    let canvas = createCanvas(canvasWidth, canvasHeight);
    canvas.parent('canvas-container');

    // 初始化鏡頭（先不開啟，等待點擊）
    let constraints = {
        video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
        },
        audio: false
    };
    video = createCapture(constraints);
    video.size(canvasWidth, canvasHeight);
    video.hide(); 
}

// 關鍵優化：解決 iPad Safari 限制，必須由使用者點擊畫面才能順利啟動相機
function mousePressed() {
    if (!isGameStarted) {
        isGameStarted = true;
        feedbackText = "AI 初始化中，請稍候...";
        classifyVideo();
    }
}

function classifyVideo() {
    if (isGameStarted) {
        classifier.classify(video, gotResult);
    }
}

function gotResult(error, results) {
    if (error) {
        console.error(error);
        return;
    }
    
    label = results[0].label;
    confidence = results[0].confidence;

    // 核心邏輯：判斷 handup 達 80% (0.8) 則加分
    if (label === "handup" && confidence >= 0.8) {
        if (!hasScoredThisTime) {
            score++;
            feedbackText = "🎯 太棒了！得分！ 🎯";
            hasScoredThisTime = true; 
        }
    } else if (label === "handdown") {
        if (hasScoredThisTime) {
            hasScoredThisTime = false;
            let randomIndex = floor(random(motivationalQuotes.length));
            feedbackText = motivationalQuotes[randomIndex];
        }
    }

    classifyVideo();
}

function draw() {
    background(15, 23, 42);

    if (isGameStarted) {
        // 鏡像翻轉顯示相機畫面
        push();
        translate(width, 0);
        scale(-1, 1);
        image(video, 0, 0, width, height);
        pop();
    }

    // 科技感半透明遮罩
    fill(15, 23, 42, 130);
    rect(0, 0, width, height);

    // 頂部狀態列
    fill(30, 41, 59, 200);
    noStroke();
    rect(0, 0, width, 70);

    // 分數顯示
    fill('#f43f5e'); 
    textSize(36);
    textAlign(LEFT, CENTER);
    textStyle(BOLD);
    text("SCORE: " + score, 20, 35);

    // 信心值進度條
    let barWidth = 150;
    let fillWidth = barWidth * confidence;
    
    noFill();
    stroke('#38bdf8');
    strokeWeight(2);
    rect(width - barWidth - 20, 25, barWidth, 20, 5);
    
    noStroke();
    if
