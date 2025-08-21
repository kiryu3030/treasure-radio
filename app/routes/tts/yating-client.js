const fs = require('fs');
const axios = require('axios');
const path = require('path');

class YatingClient {
  // ===== 常數 =====
  static TYPE_SSML = "ssml";
  static TYPE_TEXT = "text";

  static MODEL_ZHEN_FEMALE_1 = "zh_en_female_1";
  static MODEL_ZHEN_FEMALE_2 = "zh_en_female_2";
  static MODEL_ZHEN_MALE_1   = "zh_en_male_1";
  static MODEL_ZHEN_MALE_2   = "zh_en_male_2";
  static MODEL_TAI_FEMALE_1  = "tai_female_1";
  static MODEL_TAI_FEMALE_2  = "tai_female_2";
  static MODEL_TAI_MALE_1    = "tai_male_1";

  static ENCODING_MP3      = "MP3";
  static ENCODING_LINEAR16 = "LINEAR16";

  static SAMPLE_RATE_16K = "16K";
  static SAMPLE_RATE_22K = "22K";

  static RANGE_MAX = 1.5;
  static RANGE_MIN = 0.5;

  constructor(url, key) {
    this._url = url;
    this._key = key;
  }

  /**
   * 產生語音並存檔
   * @param {string} text
   * @param {"ssml"|"text"} text_type
   * @param {string} model
   * @param {number} speed  0.5~1.5
   * @param {number} pitch  0.5~1.5
   * @param {number} energy 0.5~1.5
   * @param {"MP3"|"LINEAR16"} encoding
   * @param {"16K"|"22K"} sample_rate
   * @param {string} file_name 不含副檔名
   * @param {{ timeoutMs?: number }} options 可選：timeout 毫秒
   */
  async synthesize(text, text_type, model, speed, pitch, energy, encoding, sample_rate, file_name, options = {}) {
    this.validate(text, text_type, model, speed, pitch, energy, encoding, sample_rate);
    const dto = this.generator(text, text_type, model, speed, pitch, energy, encoding, sample_rate);

    const now = new Date();
    const DATE_DIR = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
    const AUDIO_DIR = path.join(process.cwd(), 'app', 'static', 'audio', DATE_DIR);
    try{
      if(!fs.existsSync(AUDIO_DIR)){
        fs.mkdirSync(AUDIO_DIR, { recursive: true });
      }
    } catch (err) {
      console.error(err);
    }

    const headers = {
      key: this._key,
      "Content-Type": "application/json",
    };

    try {
      const { data: result } = await axios.post(this._url, dto, {
        headers,
        timeout: options.timeoutMs || 0, // 預設 0 表示不啟用 axios timeout
        timeoutErrorMessage: 'TTS request timeout'
      });

      const ext = (result?.audioConfig?.encoding === YatingClient.ENCODING_MP3) ? '.mp3' : '.wav';
      const outPath = path.join(DATE_DIR, `${file_name}${ext}`);
      const savePath = path.join(AUDIO_DIR, `${file_name}${ext}`);
      const buffer = Buffer.from(result.audioContent, 'base64');
      fs.writeFileSync(savePath, buffer);

      return outPath;
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        throw new Error('TTS request timed out');
      }
      if (err.response?.data?.message) {
        const reason = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(' ')
          : String(err.response.data.message);
        const e = new Error(reason);
        e.status = err.response.status;
        e.headers = err.response.headers;
        throw e;
      }
      throw err;
    }
  }

  validate(text, text_type, model, speed, pitch, energy, encoding, sample_rate) {
    const type_list = [YatingClient.TYPE_SSML, YatingClient.TYPE_TEXT];
    const model_list = [
      YatingClient.MODEL_ZHEN_FEMALE_1,
      YatingClient.MODEL_ZHEN_FEMALE_2,
      YatingClient.MODEL_ZHEN_MALE_1,
      YatingClient.MODEL_ZHEN_MALE_2,
      YatingClient.MODEL_TAI_FEMALE_1,
      YatingClient.MODEL_TAI_FEMALE_2,
      YatingClient.MODEL_TAI_MALE_1
    ];
    const encoding_list = [YatingClient.ENCODING_MP3, YatingClient.ENCODING_LINEAR16];

    let sample_rate_list = [];
    switch (model) {
      case YatingClient.MODEL_ZHEN_FEMALE_1:
      case YatingClient.MODEL_ZHEN_FEMALE_2:
      case YatingClient.MODEL_ZHEN_MALE_1:
      case YatingClient.MODEL_TAI_FEMALE_1:
      case YatingClient.MODEL_TAI_FEMALE_2:
      case YatingClient.MODEL_TAI_MALE_1:
        sample_rate_list = [YatingClient.SAMPLE_RATE_16K, YatingClient.SAMPLE_RATE_22K];
        break;
      case YatingClient.MODEL_ZHEN_MALE_2:
        sample_rate_list = [YatingClient.SAMPLE_RATE_22K];
        break;
    }

    if (!text) throw new Error("text is empty");
    if (!type_list.includes(text_type)) throw new Error(`${text_type} not in type_list`);
    if (!model_list.includes(model)) throw new Error(`${model} not in model_list`);
    if (!encoding_list.includes(encoding)) throw new Error(`${encoding} not in encoding_list`);
    if (!sample_rate_list.includes(sample_rate)) throw new Error(`${sample_rate} not in sample_rate_list`);
    if (speed < YatingClient.RANGE_MIN || speed > YatingClient.RANGE_MAX)
      throw new Error(`speed: ${speed} out of range`);
    if (pitch < YatingClient.RANGE_MIN || pitch > YatingClient.RANGE_MAX)
      throw new Error(`pitch: ${pitch} out of range`);
    if (energy < YatingClient.RANGE_MIN || energy > YatingClient.RANGE_MAX)
      throw new Error(`energy: ${energy} out of range`);
  }

  generator(text, text_type, model, speed, pitch, energy, encoding, sample_rate) {
    return {
      input: { text, type: text_type },
      voice: { model, speed, pitch, energy },
      audioConfig: { encoding, sampleRate: sample_rate }
    };
  }
}

module.exports = YatingClient;
