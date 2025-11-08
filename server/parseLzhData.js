// LZHの固定長テキストをJSONに変換する関数
export function parseLzhTextToJson(text) {
  const lines = text.split(/\r?\n/);
  const programs = [];

  for (const line of lines) {
    if (!line.trim() || line.length < 120) continue; // 無効行はスキップ

    const race_date = `${line.slice(0, 4)}-${line.slice(4, 6)}-${line.slice(6, 8)}`;
    const race_stadium_number = parseInt(line.slice(8, 10), 10);
    const race_number = parseInt(line.slice(10, 12), 10);
    const race_title = line.slice(12, 52).trim();
    const racer_name = line.slice(52, 72).trim();
    const racer_number = parseInt(line.slice(72, 76), 10);
    const racer_age = parseInt(line.slice(76, 78), 10);
    const racer_class_number = parseInt(line.slice(78, 79), 10);
    const racer_boat_number = parseInt(line.slice(79, 80), 10);
    const racer_average_start_timing = parseFloat(line.slice(80, 84)) / 100;
    const racer_national_top_3_percent = parseFloat(line.slice(84, 87)) / 10;

    programs.push({
      race_date,
      race_stadium_number,
      race_number,
      race_title,
      boats: [
        {
          racer_boat_number,
          racer_name,
          racer_number,
          racer_age,
          racer_class_number,
          racer_average_start_timing,
          racer_national_top_3_percent,
        },
      ],
    });
  }

  return {
    updated: new Date().toISOString(),
    venues: { programs },
  };
}