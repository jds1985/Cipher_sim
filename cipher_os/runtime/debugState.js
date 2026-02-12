// runtime/debugState.js

let LAST_RUN = null;

export function setLastRun(data) {
  LAST_RUN = {
    ...data,
    timestamp: Date.now(),
  };
}

export function getLastRun() {
  return LAST_RUN;
}
