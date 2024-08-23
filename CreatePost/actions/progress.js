// progressTracker.js
let progressValue = 0;

export const setProgress = (value) => {
    progressValue = value;
};

export const getProgress = () => {
    return progressValue;
};