import { useEffect, useState } from "react";

//for speech recognition
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [question, setQuestion] = useState(null);

  // Handle Listening
  const handleStoplistening = () => {
    setIsListening(false);
    recognition.stop();
  };

  const handleStartListening = () => {
    setIsListening(true);
    recognition.start();
  };

  // Handle Reattempt & Next Question
  const handleReAttempt = () => {
    setTranscript("");
    setFeedback(null);
    handleStartListening();
  };

  const handleNextQuestion = () => {
    setTranscript("");
    setFeedback(null);
    getQuestion();
  };

  // ✅ Get Feedback from Backend instead of OpenAI Directly
  const getFeedback = async (transcript, question) => {
    setLoadingStatus(true);
    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer: transcript }),
      });

      const data = await res.json();
      setFeedback(data);
    } catch (e) {
      console.error("Error fetching feedback:", e);
    } finally {
      setLoadingStatus(false);
    }
  };

  // ✅ Get Question from Backend
  const getQuestion = async () => {
    setLoadingQuestion(true);
    try {
      const res = await fetch("http://localhost:5000/question");
      const data = await res.json();
      setQuestion(data.question);
    } catch (e) {
      console.error("Error fetching question:", e);
    } finally {
      setLoadingQuestion(false);
    }
  };

  // ✅ Get Question on Page Load
  useEffect(() => {
    async function fetchQuestion() {
      await getQuestion();
    }
    fetchQuestion();

    recognition.onresult = (e) => {
      setTranscript(e.results[e.resultIndex][0].transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }, []);

  // ✅ Get Feedback when Transcript & Question Exist
  useEffect(() => {
    if (transcript.trim() && question && !isListening) {
      getFeedback(transcript, question);
    }
  }, [transcript, question, isListening]);

  return (
    <div className="w-full h-screen mx-auto overflow-hidden flex gap-[30px] px-16 mt-0">
      {/* Question Side */}
      <div className={`${loadingStatus || feedback ? "max-w-1/2 h-screen" : "ml-20 max-w-3xl h-screen"}`}>
        <h1 className="text-xl font-bold mt-24">
          {loadingQuestion ? "Loading Question..." : question}
        </h1>
        <p className="mt-10 font-semibold">Record your answer.</p>
        <p className="text-sm mt-10">
          Try to answer in an accurate manner and to the point in 2 minutes.
        </p>
        <div className="flex gap-10">
          <button
            onClick={isListening ? handleStoplistening : handleStartListening}
            className={isListening ? "bg-green-500 mt-10 font-md text-white rounded-lg px-2 py-1" : "bg-blue-500 mt-10 font-md text-white rounded-lg px-2 py-1"}
          >
            {isListening ? "Submit your answer" : "Record your answer"}
          </button>
          {feedback && (
            <div className="flex gap-10">
              <button onClick={handleReAttempt} className="bg-black mt-10 font-md text-white rounded-lg px-2 py-1">
                ReAttempt
              </button>
              <button onClick={handleNextQuestion} className="bg-black mt-10 font-md text-white rounded-lg px-2 py-1">
                Next Question
              </button>
            </div>
          )}
        </div>
        <p className="text-red-400">{transcript}</p>
      </div>

      {/* Feedback Container Side */}
      {feedback && (
        <div className={`${loadingStatus || feedback ? "border-l border-gray-500 max-w-1/2 h-screen" : "w-0"}`}>
          <div className="px-4">
            <p className="mt-24">{loadingStatus ? "Let's see how you answered" : ""}</p>
            <div className="border border-gray-300 px-3 py-2 rounded-lg mt-2">
              <h1 className="font-bold">Correctness</h1>
              <p>{feedback.correctness}/5</p>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={i < Number(feedback.correctness) ? "bg-blue-500 h-1 flex-1" : "bg-gray-200 flex-1 h-1"}></div>
                ))}
              </div>
            </div>

            <div className="border border-gray-300 px-3 py-2 rounded-lg mt-2">
              <h1 className="font-bold">Completeness</h1>
              <p>{feedback.completeness}/5</p>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={i < Number(feedback.completeness) ? "bg-blue-500 h-1 flex-1" : "bg-gray-200 flex-1 h-1"}></div>
                ))}
              </div>
            </div>

            <div className="border border-gray-300 px-3 py-2 rounded-lg mt-2">
              <h1 className="font-bold">Feedback</h1>
              <p>{feedback.feedback}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
