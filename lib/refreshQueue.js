export function createRefreshQueue(refreshFn) {
  let inFlight = null;

  function getRefreshPromise() {
    if (!inFlight) {
      inFlight = refreshFn().finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  }

  return { getRefreshPromise };
}
