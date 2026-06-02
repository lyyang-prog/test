// 1. 【重要】請把下方的網址換成你這次全新的 Teachable Machine 網址
const URL = 'https://teachablemachine.withgoogle.com/models/t5_tfFFbI/';

let model, webcam, ctx, labelContainer, maxPredictions;
let score = 0;
let canScore = true;

async function init() {
  const modelURL = URL + 'model.json';
  const metadataURL = URL + 'metadata.json';

  document.getElementById('status').innerHTML = '正在讀取 AI 模型，請稍候...';

  // 載入模型
  try {
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // 設定攝像頭
    const size = 400;
    const flip = true;
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);

    // 準備畫布與顯示文字
    const canvas = document.getElementById('canvas');
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext('2d');
    labelContainer = document.getElementById('label-container');
    document.getElementById('status').innerHTML =
      '遊戲進行中！請對鏡頭做出動作';
  } catch (e) {
    document.getElementById('status').innerHTML =
      '錯誤：無法讀取模型，請檢查網址或權限。';
    console.error(e);
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

  let statusHTML = '';

  for (let i = 0; i < maxPredictions; i++) {
    const className = prediction[i].className;
    const probability = prediction[i].probability;

    // 將每個類別的狀態顯示出來
    statusHTML += `<div>${className}: ${(probability * 100).toFixed(0)}%</div>`;

    // 【得分判斷邏輯】
    // 如果偵測到 Class 3 且機率高於 0.7 (70%)
    if (className === 'Class 3' && probability > 0.7 && canScore) {
      score += 1;
      document.getElementById('score-display').innerHTML = '分數：' + score;

      // 冷卻時間：加分後 1 秒鐘內不重複計分
      canScore = false;
      setTimeout(() => {
        canScore = true;
      }, 1000);
    }
  }

  labelContainer.innerHTML = statusHTML;
  drawPose(pose);
}

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
