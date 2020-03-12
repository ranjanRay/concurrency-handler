export const executeAsyncOp = async (
  data: (string | number)[] = [],
  timeout: number
) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`Async operation completes in ${timeout} ms.`);
    }, timeout);
  });
