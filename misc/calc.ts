import { TextLineStream } from "jsr:@std/streams@0.223.0/text-line-stream";
import { JsonParseStream } from "jsr:@std/json@0.223.0/json-parse-stream";

interface ResultByDate {
  workTime: number; // ミリ秒
  breakTime: number; // ミリ秒
  lastStartTime: number | null; // ミリ秒
  lastAfkTime: number | null; // ミリ秒
  startTime: number | null; // ミリ秒
  endTime: number | null; // ミリ秒
}

// 時間をXhXXm形式にフォーマットする
const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours}h${remainingMinutes.toString().padStart(2, "0")}m`;
};

// タイムスタンプを日本時間でフォーマットする
const formatTimestamp = (timestamp: number | null): string | null => {
  if (timestamp === null) return null;
  const date = new Date(timestamp);
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }); // ローカルタイムを日本時間でフォーマット
};

const calculateTimeByDate = () => {
  const result: Record<string, ResultByDate> = {};

  return {
    processEntry(entry: any) {
      const date = entry.time.split(" ")[0]; // Extract date (YYYY-MM-DD)

      if (!result[date]) {
        result[date] = {
          workTime: 0,
          breakTime: 0,
          lastStartTime: null,
          lastAfkTime: null,
          startTime: null,
          endTime: null,
        };
      }

      const currentTime = new Date(entry.time).getTime();

      if (entry.status === "start") {
        result[date].lastStartTime = currentTime;
        result[date].startTime = currentTime; // 最初の勤務開始時間を記録
      } else if (entry.status === "afk") {
        if (result[date].lastStartTime !== null) {
          // 休憩を始める時、働いた時間を計算する
          result[date].workTime += currentTime - result[date].lastStartTime;
        }
        result[date].lastAfkTime = currentTime; // 離席時間を記録
        result[date].lastStartTime = null; // 勤務中の時間をリセット
      } else if (entry.status === "back") {
        if (result[date].lastAfkTime !== null) {
          // 戻った時に休憩時間を計算する
          result[date].breakTime += currentTime - result[date].lastAfkTime;
        }
        result[date].lastStartTime = currentTime; // 勤務を再開
        result[date].lastAfkTime = null; // 離席時間をリセット
      } else if (entry.status === "end") {
        if (result[date].lastStartTime !== null) {
          // 勤務終了時に残っている勤務時間を加算
          result[date].workTime += currentTime - result[date].lastStartTime;
        }
        result[date].endTime = currentTime; // 最後の勤務終了時間を記録
      }
    },
    getResult() {
      for (const key in result) {
        if (
          key in result && result[key].endTime == null &&
          result[key].lastStartTime != null
        ) {
          const currentTime = new Date().getTime();
          result[key].workTime += currentTime - result[key].lastStartTime;
          result[key].endTime = currentTime;
        }
      }
      return result;
    },
  };
};

// メインの処理
const main = async () => {
  const calculator = calculateTimeByDate();

  // Denoでは、標準入力を逐次的に読み取る
  const reader = Deno.stdin.readable
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream())
    .pipeThrough(new JsonParseStream());

  for await (const entry of reader) {
    calculator.processEntry(entry);
  }

  const resultByDate = calculator.getResult();
  const formatted = [];

  // フォーマットして出力
  for (const date in resultByDate) {
    const workTimeInMinutes = resultByDate[date].workTime / 1000 / 60;
    const breakTimeInMinutes = resultByDate[date].breakTime / 1000 / 60;

    formatted.push({
      date,
      workTime: formatTime(workTimeInMinutes),
      breakTime: formatTime(breakTimeInMinutes),
      startTime: formatTimestamp(resultByDate[date].startTime),
      endTime: formatTimestamp(resultByDate[date].endTime),
    });
  }

  console.log(JSON.stringify(formatted, null, 2)); // 結果を整形して出力
};

main();
