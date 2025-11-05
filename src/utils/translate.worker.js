import { pipeline } from "@xenova/transformers";

class MyTranslationPipeline {
  static task = "translation";
  static model = "Xenova/nllb-200-distilled-600M";
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = await pipeline(this.task, null, { progress_callback });
    }

    return this.instance;
  }
}

self.addEventListener("message", async (e) => {
  let translator = await MyTranslationPipeline.getInstance((x) => {
    self.postMessage(x);
  });

  let output = await translator(e.data.text, {
    tgt_lang: e.data.tgt_lang,
    src_lang: e.data.src_lang,
    callback_function: (x) => {
      self.postMessage({
        status: "update",
        output: translator.tokenizer.decode(x[0].output_token_ids, {
          skip_special_tokens: true,
        }),
      });
    },
  });

  self.postMessage({
    status: 'complete',
    output
  })
});
