import { useState, useEffect } from "react";

import "./styles.css";

const workercode = () => {
  let timerInterval;
  let time = 0;
  self.onmessage = function ({ data: { turn } }) {
    if (turn === "off" || timerInterval) {
      clearInterval(timerInterval);
      time = 0;
    }
    if (turn === "on") {
      timerInterval = setInterval(() => {
        time += 1;
        self.postMessage({ time });
      }, 1000);
    }
  };
};

let code = workercode.toString();
code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

const blob = new Blob([code], { type: "application/javascript" });
const worker_script = URL.createObjectURL(blob);
// const timerWorker = new Worker(worker_script);

export default function App() {
  const [worker, setWorker] = useState(0);
  const [webWorkerTime, setWebWorkerTime] = useState(0);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const expiryTime = 5;

  useEffect(() => {
    const newWorker = new Worker(worker_script);
    localStorage.setItem("localLogout", false);
    setIsLoggedOut(false);
    setWorker(newWorker);
  }, []);

  useEffect(() => {
    if (!!worker) {
      document.addEventListener("visibilitychange", handleVisibiliyChange);
    }
  }, [worker, isLoggedOut]);

  console.log({ worker, isLoggedOut });

  const handleVisibiliyChange = () => {
    const localLogout = JSON.parse(localStorage.getItem("localLogout"));
    if (document.visibilityState !== "visible" && !localLogout) {
      startWebWorkerTimer();
    } else {
      resetWebWorkerTimer();
    }
  };

  const startWebWorkerTimer = () => {
    console.log("start");
    worker.postMessage({ turn: "on" });
    worker.onmessage = ({ data: { time } }) => {
      console.log({ time });
      if (time === expiryTime) {
        worker.terminate();
        console.log("remove event");
        document.removeEventListener("visibilitychange", handleVisibiliyChange);
        setWorker("");
        localStorage.setItem("localLogout", true);
        setIsLoggedOut(true);
      }
      setWebWorkerTime(time);
    };
  };

  const resetWebWorkerTimer = () => {
    console.log("reset");
    worker.postMessage({ turn: "off" });
    worker.onmessage = ({ data: { time } }) => setWebWorkerTime(time);
  };

  return (
    <div
      className="App"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        background: "black"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          margin: "0 0 10px",
          background: "dodgerblue",
          color: "white"
        }}
      >
        <div>State: {isLoggedOut ? "Logged Out" : "Logged In"}</div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
          margin: "0 0 30px",
          background: "tomato",
          color: "white"
        }}
      >
        <div>Inactive Time: {webWorkerTime}s</div>
      </div>
      <div
        onClick={() => {
          if (isLoggedOut) {
            localStorage.setItem("localLogout", false);
            setIsLoggedOut(false);
            setWebWorkerTime(0);
            const newWorker = new Worker(worker_script);
            setWorker(newWorker);
          }
        }}
        style={{
          padding: "20px",
          margin: "0 0 30px",
          maxWidth: "250px",
          width: "100%",
          background: "#333",
          color: "white",
          cursor: "pointer"
        }}
      >
        CLICK TO LOG IN
      </div>
      <div style={{ color: "white" }}>
        automatically logs out if tab is inactive for {expiryTime} sec
      </div>
    </div>
  );
}
