async function predict() {
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    if (pose) {
        drawPose(pose);
    }

    let handupProbability = 0;
    let handdownProbability = 0;

    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].className === "handup") {
            handupProbability = prediction[i].probability;
        } else if (prediction[i].className === "handdown") {
            handdownProbability = prediction[i].probability;
        }
    }

    const labelContainer = document.getElementById("label-container");
    
    // 💡 核心改動：強制把數值印出來！
    // 畫面上會顯示舉手和放下的即時機率。
    // 請幫我觀察：當你手放下來時，HANDUP 的百分比有沒有跌破 70%？HANDDOWN 有沒有升上來？
    labelContainer.innerHTML = `舉手: ${(handupProbability * 100).toFixed(0)}% | 放下: ${(handdownProbability * 100).toFixed(0)}%`;

    // 試試看最安全的「大於 70% 就瘋狂加分」
    if (handupProbability >= 0.70) {
        score++;
        document.getElementById("score-display").innerText = score;
    }
}
