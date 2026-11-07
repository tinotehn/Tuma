export async function checkTransactionWithGemini(_input: any) {
  return {
    shouldBlock: false,
    risk: "LOW",
    warningMessage: "",
  };
}
