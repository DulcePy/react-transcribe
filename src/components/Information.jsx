import { useState, useEffect, useRef } from "react";
import Transcription from "./Transcription";
import Translation from "./Translation";

export default function Information(props) {
  const { output, finished } = props;
  const [tab, setTab] = useState("transcription");
  const [translation, setTranslation] = useState(null);
  const [translating, setTranslating] = useState(null);
  const [toLanguage, setToLanguage] = useState("Select language");

  const worker = useRef();

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(
        new URL("../utils/translate.worker.js", import.meta.url),
        {
          type: "module",
        }
      );
    }

    const onMessageReceived = async (e) => {
      switch (e.data.status) {
        case "initiate":
          break;

        case "progress":
          break;

        case "update":
          setTranslation(e.data.output);
          break;

        case "complete":
          setTranslating(false);
          break;
      }
    };

    worker.current.addEventListener("message", onMessageReceived);

    return () =>
      worker.current.removeEventListener("message", onMessageReceived);
  });

  const textElement =
    tab === "transcription"
      ? output.map((val) => val.text)
      : translation || "No translation";

  function handleCopy() {
    navigator.clipboard.writeText(textElement);
  }

  function handleDownload() {
    const element = document.createElement("a");
    const file = new Blob([textElement], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Freescribe_${new Date().toString()}.txt`;
    document.body.appendChild(element);
    element.click();
  }

  function generateTranslation() {
    if (translating || toLanguage === "Select language") {
      return;
    }

    setTranslating(true);

    worker.current.postMessage({
      text: output.map((val) => val.text),
      src_lang: "eng_Latn",
      tgt_lang: toLanguage,
    });
  }

  return (
    <main className="flex-1 p-4 flex flex-col gap-3 sm:gap-4 justify-center text-center pb-20 max-w-prose w-full mx-auto">
      <h1 className="font-semibold text-4xl sm:text-5xl md:text-6xl whitespace-nowrap">
        Your <span className="text-blue-600 bold">Transcription</span>
      </h1>

      <div className="grid grid-cols-2 items-center mx-auto bg-white shadow rounded-full overflow-hidden">
        <button
          onClick={() => setTab("transcription")}
          className={
            "px-4 py-1 duration-200 " +
            (tab === "transcription"
              ? "bg-blue-300 text-white"
              : "text-blue-400 hover:text-blue-600")
          }
        >
          Transcription
        </button>
        <button
          onClick={() => setTab("translation")}
          className={
            "px-4 py-1 duration-200 " +
            (tab === "translation"
              ? "bg-blue-300 text-white"
              : "text-blue-400 hover:text-blue-600")
          }
        >
          Translation
        </button>
      </div>

      <div className="my-8 flex flex-col-reverse max-w-porse w-full mx-auto gap-4">
        {(!finished || translating) && (
          <div className="grid place-items-center">
            <i className="fa-solid fa-spinner animate-spin"></i>
          </div>
        )}
        {tab === "transcription" ? (
          <Transcription {...props} textElement={textElement} />
        ) : (
          <Translation
            {...props}
            toLanguage={toLanguage}
            translating={translating}
            textElement={textElement}
            setToLanguage={setToLanguage}
            setTranslating={setTranslating}
            setTranslation={setTranslation}
            generateTranslation={generateTranslation}
          />
        )}
      </div>

      <div className="flex items-center gap-4 mx-auto">
        <button
          onClick={handleCopy}
          title="Copy"
          className="bg-white text-blue-400 px-2 aspect-square grid place-items-center rounded hover:bg-blue-500 duration-200"
        >
          <i className="fa-solid fa-copy"></i>
        </button>
        <button
          onClick={handleDownload}
          title="Download"
          className="bg-white text-blue-400 px-2 aspect-square grid place-items-center rounded hover:bg-blue-500 duration-200"
        >
          <i className="fa-solid fa-download"></i>
        </button>
      </div>
    </main>
  );
}
