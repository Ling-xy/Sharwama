"use strict";

const languageText = {
  bm: { title: "SHAWARMA TOKOH TERBILANG MELAKA", subtitle: "Belajar sambil bermain!", heading: "PILIH BAHASA", start: "MULA", score: "SKOR", coins: "SYILING", order: "PESANAN", request: "PESANAN PELANGGAN", grill: "Klik gril untuk mula memasak.", wrap: "Klik roti untuk membalut shawarma.", serve: "Klik papan serah untuk menghantar pesanan." },
  zh: { title: "马六甲杰出人物沙威玛店", subtitle: "边玩边学习！", heading: "选择语言", start: "开始游戏", score: "分数", coins: "金币", order: "订单", request: "顾客订单", grill: "点击烤架开始烹饪。", wrap: "点击饼皮包裹沙威玛。", serve: "点击交付台送出订单。" },
  both: { title: "SHAWARMA TOKOH TERBILANG MELAKA｜马六甲杰出人物沙威玛店", subtitle: "Belajar sambil bermain!｜边玩边学习！", heading: "PILIH BAHASA｜选择语言", start: "MULA｜开始游戏", score: "SKOR｜分数", coins: "SYILING｜金币", order: "PESANAN｜订单", request: "PESANAN PELANGGAN｜顾客订单", grill: "Klik gril untuk mula memasak.｜点击烤架开始烹饪。", wrap: "Klik roti untuk membalut shawarma.｜点击饼皮包裹沙威玛。", serve: "Klik papan serah untuk menghantar pesanan.｜点击交付台送出订单。" }
};
const names = { meat: ["Daging", "肉"], lettuce: ["Salad", "生菜"], tomato: ["Tomato", "番茄"], cucumber: ["Timun", "黄瓜"], onion: ["Bawang", "洋葱"], red: ["Sos Merah", "红酱"], white: ["Sos Putih", "白酱"] };
let language = "both";
let phase = "idle";
let selected = [];
let currentOrder = ["meat", "lettuce", "tomato", "white"];
let score = 0;
let coins = 0;
let orderNumber = 1;
let answeredQuestions = 0;
let correctQuestions = 0;

function playBackgroundMusic() {
  const backgroundMusic = document.querySelector("#backgroundMusic");

  if (!backgroundMusic || !backgroundMusic.paused) return;

  backgroundMusic.volume = 0.28;
  backgroundMusic.play().catch(() => {
    /* Browsers may block audio until the next direct player interaction. */
  });
}

/* Original, synthesized game effects. They use Web Audio and never replace the music track. */
class SFXManager {
  constructor() {
    const savedEnabled = localStorage.getItem("shawarma-sfx-enabled");
    const savedVolume = localStorage.getItem("shawarma-sfx-volume");

    this.enabled = savedEnabled === null ? true : savedEnabled === "true";
    this.volume = savedVolume !== null && Number.isFinite(Number(savedVolume)) && Number(savedVolume) >= 0
      ? Math.min(Number(savedVolume), 1)
      : 0.65;
    this.context = null;
    this.loops = new Map();
    this.lastPlayed = new Map();
    this.wasPaused = false;
    this.outputBoost = 2.25;
  }

  initSFX() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.context = new AudioContext();
    }
    if (this.context.state === "suspended") this.context.resume().catch(() => {});
    return true;
  }

  setSFXVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value)));
    localStorage.setItem("shawarma-sfx-volume", String(this.volume));
  }

  toggleSFX(enabled) {
    this.enabled = typeof enabled === "boolean" ? enabled : !this.enabled;
    localStorage.setItem("shawarma-sfx-enabled", String(this.enabled));
    if (!this.enabled) this.stopAllLoopSFX();
    return this.enabled;
  }

  canPlay(name, cooldown = 75) {
    const now = performance.now();
    if ((this.lastPlayed.get(name) || 0) + cooldown > now) return false;
    this.lastPlayed.set(name, now);
    return true;
  }

  tone(frequency, duration, gain = 0.08, type = "sine", slide = 0) {
    if (!this.context || !this.enabled) return;
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const volume = ctx.createGain();
    const time = ctx.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), time + duration);
    volume.gain.setValueAtTime(0.0001, time);
    volume.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * this.volume * this.outputBoost), time + 0.012);
    volume.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(volume).connect(ctx.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  noise(duration, gain = 0.035, filterFrequency = 1300) {
    if (!this.context || !this.enabled) return;
    const ctx = this.context;
    const buffer = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * duration)), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const volume = ctx.createGain();
    const time = ctx.currentTime;
    filter.type = "lowpass";
    filter.frequency.value = filterFrequency;
    volume.gain.setValueAtTime(gain * this.volume * this.outputBoost, time);
    volume.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    source.buffer = buffer;
    source.connect(filter).connect(volume).connect(ctx.destination);
    source.start(time);
  }

  later(delay, callback) {
    window.setTimeout(() => {
      if (this.enabled) callback();
    }, delay);
  }

  playSFX(name) {
    if (!this.enabled || !this.initSFX() || !this.canPlay(name)) return;
    const cutPitch = 230 + Math.random() * 45;
    const simpleClick = () => { this.tone(240, 0.065, 0.055, "triangle", -25); this.later(28, () => this.tone(650, 0.055, 0.03, "sine")); };
    const bright = () => { this.tone(470, 0.07, 0.07, "triangle", 110); this.later(65, () => this.tone(690, 0.11, 0.06, "sine", 120)); };
    const softWrong = () => this.tone(165, 0.12, 0.055, "sine", -30);

    switch (name) {
      case "buttonClick": simpleClick(); break;
      case "buttonConfirm": bright(); break;
      case "buttonDisabled": this.tone(125, 0.08, 0.035, "triangle", -10); break;
      case "customerBell": this.tone(720, 0.08, 0.045, "sine", 120); this.later(90, () => this.tone(920, 0.12, 0.04, "sine")); break;
      case "newOrder": this.tone(520, 0.07, 0.045, "triangle", 80); this.later(75, () => this.tone(680, 0.11, 0.05, "sine")); break;
      case "grillIgnite": this.noise(0.16, 0.055, 720); this.tone(105, 0.16, 0.035, "sawtooth", 70); break;
      case "grillPerfect": bright(); break;
      case "grillRaw": softWrong(); break;
      case "grillBurnt": this.noise(0.1, 0.035, 420); this.tone(105, 0.09, 0.035, "sine", -45); break;
      case "knifeCut": this.noise(0.045, 0.045, 880); this.tone(cutPitch, 0.045, 0.035, "triangle", -20); break;
      case "cutComplete": this.tone(620, 0.07, 0.05, "sine", 80); this.later(65, () => this.tone(820, 0.12, 0.05, "sine")); break;
      case "addLettuce": this.noise(0.06, 0.032, 1800); this.tone(520, 0.045, 0.02, "triangle"); break;
      case "addTomato": this.tone(215, 0.08, 0.05, "sine", 45); break;
      case "addCucumber": this.tone(690, 0.055, 0.045, "triangle", -40); break;
      case "addOnion": this.tone(430, 0.055, 0.035, "sine", 60); break;
      case "addMeat": this.noise(0.05, 0.035, 700); this.tone(175, 0.06, 0.045, "triangle"); break;
      case "sauceRed": this.noise(0.18, 0.025, 500); this.tone(180, 0.18, 0.035, "sine", -20); break;
      case "sauceWhite": this.noise(0.18, 0.025, 800); this.tone(285, 0.18, 0.035, "sine", 20); break;
      case "wrapFold1": this.noise(0.13, 0.025, 1000); this.tone(250, 0.1, 0.025, "triangle", -25); break;
      case "wrapFold2": this.noise(0.15, 0.03, 750); this.tone(190, 0.1, 0.03, "triangle", -15); break;
      case "wrapComplete": this.tone(460, 0.1, 0.05, "triangle", 90); this.later(90, () => this.tone(730, 0.13, 0.05, "sine")); break;
      case "orderSuccess": bright(); break;
      case "orderWrong": softWrong(); break;
      case "perfectOrder": this.tone(360, 0.07, 0.045, "triangle", 80); this.later(85, () => this.tone(620, 0.09, 0.055, "sine")); this.later(180, () => this.tone(820, 0.14, 0.05, "sine")); break;
      case "quizCorrect": bright(); break;
      case "quizWrong": softWrong(); break;
      case "coin": this.tone(880, 0.065, 0.05, "sine", 90); break;
      case "combo": this.tone(500, 0.06, 0.04, "triangle", 80); this.later(60, () => this.tone(700, 0.08, 0.05, "triangle", 120)); break;
      case "characterUnlock": this.tone(430, 0.08, 0.045, "triangle", 100); this.later(90, () => this.tone(700, 0.16, 0.06, "sine", 130)); break;
      case "royalStamp": this.noise(0.07, 0.045, 560); this.tone(210, 0.1, 0.05, "triangle"); break;
      case "levelComplete": bright(); this.later(150, () => this.tone(880, 0.15, 0.055, "sine")); break;
      default: simpleClick();
    }
  }

  playLoopSFX(name) {
    if (!this.enabled || this.loops.has(name) || !this.initSFX()) return;
    const playTick = () => {
      if (!this.enabled || !this.loops.has(name)) return;
      if (name === "grillLoop") {
        this.noise(0.12, 0.018, 900);
        this.tone(92, 0.12, 0.012, "sine", 8);
      }
    };
    playTick();
    this.loops.set(name, window.setInterval(playTick, 380));
  }

  stopLoopSFX(name) {
    const loop = this.loops.get(name);
    if (loop) window.clearInterval(loop);
    this.loops.delete(name);
  }

  stopAllLoopSFX() {
    [...this.loops.keys()].forEach(name => this.stopLoopSFX(name));
  }

  pauseSFX() {
    this.wasPaused = this.loops.size > 0;
    this.stopAllLoopSFX();
  }

  resumeSFX() {
    if (this.wasPaused && phase === "grill") this.playLoopSFX("grillLoop");
    this.wasPaused = false;
  }
}

const sfxManager = new SFXManager();

const orderPatterns = [
  ["meat", "lettuce", "tomato", "white"],
  ["meat", "onion", "cucumber", "red"],
  ["meat", "lettuce", "onion", "white"],
  ["meat", "lettuce", "tomato", "cucumber", "red", "white"]
];

function label(food) {
  const [bm, zh] = names[food];

  if (language === "bm") return bm;
  if (language === "zh") return zh;

  return `${bm}｜${zh}`;
}
function ui() {
  const text = languageText[language];

  document.querySelector("#gameTitle").textContent = text.title;
  document.querySelector("#gameSubtitle").textContent = text.subtitle;
  document.querySelector("#languageHeading").textContent = text.heading;
  document.querySelector("#startButton").textContent = text.start;

  document.querySelector("#scoreLabel").textContent = text.score;
  document.querySelector("#coinLabel").textContent = text.coins;
  document.querySelector("#orderLabel").textContent = text.order;
  document.querySelector("#requestTitle").textContent = text.request;

  document.querySelector("#score").textContent = score;
  document.querySelector("#coins").textContent = coins;
  document.querySelector("#orderCount").textContent = orderNumber;
  document.querySelector("#requestText").textContent = currentOrder.map(label).join(" · ");
  flatbreadButton.dataset.label = language === "bm" ? "BALUT" : language === "zh" ? "包裹" : "BALUT｜包裹";
  serveButton.dataset.label = language === "bm" ? "SERAH" : language === "zh" ? "交付" : "SERAH｜交付";
}
function toast(message) { const box = document.querySelector("#toast"); box.textContent = message; box.classList.add("show-toast"); setTimeout(() => box.classList.remove("show-toast"), 1500); }
function createFoodLabels() {
  const layer = document.querySelector("#foodLabels");
  const positions = {
    meat: [12, 84],
    lettuce: [23, 84],
    tomato: [34, 84],
    cucumber: [45, 84],
    onion: [56, 84],
    /* Sauce labels are deliberately staggered so BM + 中文 never overlap. */
    white: [51, 53],
    red: [64, 47]
  };

  layer.innerHTML = "";

  Object.keys(names).forEach(food => {
    const button = document.createElement("button");
    const [left, top] = positions[food];

    button.textContent = label(food);
    button.classList.add("food-label", `food-${food}`);
    button.style.left = `${left}vw`;
    button.style.top = `${top}vh`;
    button.onclick = () => chooseFood(food);

    layer.append(button);
  });
}
function startGame() {
  sfxManager.initSFX();
  sfxManager.stopAllLoopSFX();
  sfxManager.playSFX("buttonConfirm");
  playBackgroundMusic();
  score = 0;
  coins = 0;
  orderNumber = 1;
  answeredQuestions = 0;
  correctQuestions = 0;
  selected = [];
  unusedQuestions = [];
  phase = "grill";
  currentOrder = [...orderPatterns[0]];
  document.querySelector("#flatbreadToppings").innerHTML = "";
  endScreen.classList.remove("visible");
  homeScreen.classList.remove("visible");
  gameScreen.classList.add("visible");
  instruction.textContent = languageText[language].grill;
  ui();
  createFoodLabels();
  sfxManager.playSFX("customerBell");
  sfxManager.later(120, () => sfxManager.playSFX("newOrder"));
}
function chooseFood(food) {
  if (phase !== "ingredients") {
    sfxManager.playSFX("buttonDisabled");
    toast(language === "zh" ? "请先完成烤制。" : "Selesaikan masakan dahulu.");
    return;
  }
  if (!currentOrder.includes(food) || selected.includes(food)) {
    sfxManager.playSFX("orderWrong");
    toast(language === "zh" ? "这个食材不在订单中。" : "Bahan ini tiada dalam pesanan.");
    return;
  }

  selected.push(food);
  score += 5;
  const soundName = {
    meat: "addMeat", lettuce: "addLettuce", tomato: "addTomato", cucumber: "addCucumber", onion: "addOnion", red: "sauceRed", white: "sauceWhite"
  }[food];
  sfxManager.playSFX(soundName);
  const topping = document.createElement("i");
  topping.className = `topping ${food}`;
  flatbreadToppings.append(topping);
  ui();
  toast(`${label(food)} ✓`);
  if (selected.length === currentOrder.length) {
    phase = "wrap";
    instruction.textContent = languageText[language].wrap;
    sfxManager.playSFX("combo");
  }
}
document.querySelectorAll("[data-language]").forEach(button => {
  button.onclick = () => {
    sfxManager.playSFX("buttonClick");
    language = button.dataset.language;
    document.querySelectorAll("[data-language]").forEach(item => {
      item.classList.toggle("active", item === button);
    });
    ui();
    createFoodLabels();
  };
});
startButton.onclick = startGame;
restartButton.onclick = startGame;
grillButton.onclick = () => {
  if (phase !== "grill") return sfxManager.playSFX("buttonDisabled");
  sfxManager.playSFX("grillIgnite");
  sfxManager.playLoopSFX("grillLoop");
  phase = "grill-cooking";
  instruction.textContent = language === "zh" ? "烤肉进行中……" : language === "bm" ? "Daging sedang dimasak…" : "Daging sedang dimasak…｜烤肉进行中……";
  window.setTimeout(() => {
    if (phase !== "grill-cooking") return;
    sfxManager.stopLoopSFX("grillLoop");
    sfxManager.playSFX("grillPerfect");
    phase = "ingredients";
    instruction.textContent = language === "zh" ? "烤肉完成。点击订单中的食材。" : language === "bm" ? "Daging siap. Pilih bahan dalam pesanan." : "Daging siap｜烤肉完成。点击订单食材。";
    toast(language === "zh" ? "烤肉完成！" : "Daging siap!");
  }, 520);
};
flatbreadButton.onclick = () => {
  if (phase !== "wrap") {
    sfxManager.playSFX("buttonDisabled");
    return toast(language === "zh" ? "请先完成所有食材。" : "Pilih semua bahan dahulu.");
  }
  phase = "wrapping";
  flatbreadButton.classList.add("wrapping");
  sfxManager.playSFX("wrapFold1");
  window.setTimeout(() => sfxManager.playSFX("wrapFold2"), 280);
  window.setTimeout(() => sfxManager.playSFX("wrapComplete"), 630);
  window.setTimeout(() => {
    if (phase !== "wrapping") return;
    phase = "serve";
    flatbreadButton.classList.remove("wrapping");
    instruction.textContent = languageText[language].serve;
    toast(language === "zh" ? "沙威玛完成！" : language === "bm" ? "Shawarma Siap!" : "Shawarma Siap!｜沙威玛完成！");
  }, 900);
};
serveButton.onclick = () => {
  if (phase !== "serve") {
    sfxManager.playSFX("buttonDisabled");
    return toast(language === "zh" ? "请先包裹沙威玛。" : "Balut shawarma dahulu.");
  }
  sfxManager.playSFX("buttonConfirm");
  sfxManager.playSFX("orderSuccess");
  sfxManager.later(85, () => sfxManager.playSFX("coin"));
  sfxManager.later(175, () => sfxManager.playSFX("customerBell"));
  score += 50;
  coins += 5;
  phase = "complete";
  ui();
  toast(language === "zh" ? "订单完成！" : "Pesanan siap!");
  setTimeout(showQuiz, 700);
};
const quizBank = [
  { bm: "Kami merupakan individu yang dihormati dan disanjungi oleh masyarakat kerana memberikan sumbangan besar kepada Melaka. Siapakah kami?", zh: "我们因为对马六甲作出重大贡献，而受到社会的尊敬与爱戴。我们被称为什么？", options: [["Pedagang Asing", "外国商人"], ["Tokoh Terbilang", "杰出人物"], ["Pelawat Istana", "王宫访客"], ["Rakyat Biasa", "普通百姓"]], correct: 1 },
  { bm: "Aku berada pada kedudukan paling tinggi dalam struktur masyarakat Kesultanan Melayu Melaka. Siapakah aku?", zh: "我位于马六甲苏丹王朝社会结构的最高位置。我是谁？", options: [["Sultan", "苏丹"], ["Pembesar", "大臣"], ["Rakyat", "人民"], ["Hamba", "奴仆"]], correct: 0 },
  { bm: "Antara berikut, yang manakah susunan struktur masyarakat Kesultanan Melayu Melaka yang betul?", zh: "以下哪一项是马六甲苏丹王朝正确的社会阶层顺序？", options: [["Rakyat, Sultan, Hamba, Pembesar", "人民、苏丹、奴仆、大臣"], ["Sultan, Pembesar, Rakyat, Hamba", "苏丹、大臣、人民、奴仆"], ["Pembesar, Rakyat, Sultan, Hamba", "大臣、人民、苏丹、奴仆"], ["Hamba, Rakyat, Pembesar, Sultan", "奴仆、人民、大臣、苏丹"]], correct: 1 },
  { bm: "Aku menjadi pemerintah tertinggi dan lambang perpaduan rakyat. Apakah jawatanku?", zh: "我是国家的最高统治者，也是人民团结的象征。我的职位是什么？", options: [["Bendahara", "宰相"], ["Laksamana", "海军统帅"], ["Sultan", "苏丹"], ["Pedagang", "商人"]], correct: 2 },
  { bm: "Aku seorang putera yang mengasaskan Kesultanan Melayu Melaka. Siapakah aku?", zh: "我是一位建立马六甲苏丹王朝的王子。我是谁？", options: [["Hang Tuah", "汉都亚"], ["Tun Perak", "敦霹雳"], ["Sultan Mansur Shah", "苏丹满速沙"], ["Parameswara", "拜里米苏拉"]], correct: 3 },
  { bm: "Aku berusaha memajukan Melaka sehingga menjadi sebuah pusat perdagangan yang terkenal. Siapakah aku?", zh: "我努力发展马六甲，使它成为著名的贸易中心。我是谁？", options: [["Parameswara", "拜里米苏拉"], ["Sultan Alauddin Riayat Shah", "苏丹阿拉乌丁利亚沙"], ["Tun Perak", "敦霹雳"], ["Hang Tuah", "汉都亚"]], correct: 0 },
  { bm: "Aku mengukuhkan empayar Melaka dan menjadikannya semakin kuat. Siapakah aku?", zh: "我巩固了马六甲的版图，使王朝变得更加强盛。我是谁？", options: [["Sultan Mansur Shah", "苏丹满速沙"], ["Sultan Muzaffar Shah", "苏丹慕扎法沙"], ["Sultan Alauddin Riayat Shah", "苏丹阿拉乌丁利亚沙"], ["Parameswara", "拜里米苏拉"]], correct: 1 },
  { bm: "Aku melaksanakan sistem perundangan yang tersusun di Melaka. Siapakah aku?", zh: "我在马六甲推行有系统的法律制度。我是谁？", options: [["Sultan Muzaffar Shah", "苏丹慕扎法沙"], ["Sultan Mansur Shah", "苏丹满速沙"], ["Bendahara Tun Perak", "宰相敦霹雳"], ["Laksamana Hang Tuah", "海军统帅汉都亚"]], correct: 0 },
  { bm: "Aku meluaskan empayar Melaka sehingga wilayahnya menjadi semakin besar. Siapakah aku?", zh: "我扩大了马六甲的版图，使王朝的领土更加辽阔。我是谁？", options: [["Tun Perak", "敦霹雳"], ["Sultan Muzaffar Shah", "苏丹慕扎法沙"], ["Sultan Mansur Shah", "苏丹满速沙"], ["Hang Tuah", "汉都亚"]], correct: 2 },
  { bm: "Pada zaman pemerintahanku, Melaka berkembang sebagai pusat penyebaran agama Islam dan pusat pendidikan. Siapakah aku?", zh: "在我的统治时期，马六甲发展成为传播伊斯兰教和推动教育的重要中心。我是谁？", options: [["Sultan Alauddin Riayat Shah", "苏丹阿拉乌丁利亚沙"], ["Parameswara", "拜里米苏拉"], ["Sultan Mansur Shah", "苏丹满速沙"], ["Sultan Muzaffar Shah", "苏丹慕扎法沙"]], correct: 2 },
  { bm: "Aku sentiasa mengambil berat tentang keamanan dan keselamatan dalam negeri. Siapakah aku?", zh: "我一直非常重视国家内部的和平与安全。我是谁？", options: [["Sultan Alauddin Riayat Shah", "苏丹阿拉乌丁利亚沙"], ["Sultan Mansur Shah", "苏丹满速沙"], ["Parameswara", "拜里米苏拉"], ["Hang Tuah", "汉都亚"]], correct: 0 },
  { bm: "Kesusahan dan kebajikan rakyat sentiasa menjadi perhatianku. Siapakah aku?", zh: "人民的生活与福利一直是我关注的事情。我是谁？", options: [["Sultan Muzaffar Shah", "苏丹慕扎法沙"], ["Sultan Alauddin Riayat Shah", "苏丹阿拉乌丁利亚沙"], ["Sultan Mansur Shah", "苏丹满速沙"], ["Bendahara Tun Perak", "宰相敦霹雳"]], correct: 1 },
  { bm: "Aku seorang bendahara yang menguruskan pentadbiran Melaka secara sistematik. Siapakah aku?", zh: "我是一位有系统地管理马六甲行政事务的宰相。我是谁？", options: [["Hang Tuah", "汉都亚"], ["Tun Perak", "敦霹雳"], ["Parameswara", "拜里米苏拉"], ["Sultan Muzaffar Shah", "苏丹慕扎法沙"]], correct: 1 },
  { bm: "Aku menjadi penasihat sultan dalam urusan pentadbiran. Apakah jawatanku?", zh: "我负责在行政事务上向苏丹提供建议。我的职位是什么？", options: [["Laksamana", "海军统帅"], ["Bendahara", "宰相"], ["Pedagang", "商人"], ["Rakyat", "人民"]], correct: 1 },
  { bm: "Aku ialah ketua pembesar, ketua diplomat dan boleh mengetuai angkatan perang. Apakah jawatanku?", zh: "我是大臣之首、外交负责人，也可以领导军队。我的职位是什么？", options: [["Bendahara", "宰相"], ["Laksamana", "海军统帅"], ["Sultan", "苏丹"], ["Syahbandar", "港务官"]], correct: 0 },
  { bm: "Apabila sultan gering atau berada di luar negeri, aku boleh menjalankan tugas sebagai pemangku sultan. Apakah jawatanku?", zh: "当苏丹生病或离开国家时，我可以暂时代行苏丹的职务。我的职位是什么？", options: [["Laksamana", "海军统帅"], ["Rakyat", "人民"], ["Bendahara", "宰相"], ["Pedagang", "商人"]], correct: 2 },
  { bm: "Aku seorang laksamana yang terkenal dengan keberanian, kebijaksanaan dan kesetiaan. Siapakah aku?", zh: "我是一位以勇敢、智慧和忠诚闻名的海军统帅。我是谁？", options: [["Tun Perak", "敦霹雳"], ["Sultan Mansur Shah", "苏丹满速沙"], ["Parameswara", "拜里米苏拉"], ["Hang Tuah", "汉都亚"]], correct: 3 },
  { bm: "Aku menjaga keamanan perairan Melaka dan keselamatan para pedagang. Apakah jawatanku?", zh: "我负责维护马六甲海域的和平，并保护来往商人的安全。我的职位是什么？", options: [["Sultan", "苏丹"], ["Laksamana", "海军统帅"], ["Bendahara", "宰相"], ["Pembesar", "大臣"]], correct: 1 },
  { bm: "Aku melaksanakan perintah sultan dan mengetuai rombongan rasmi Melaka ke China. Siapakah aku?", zh: "我执行苏丹的命令，并带领马六甲官方使团前往中国。我是谁？", options: [["Hang Tuah", "汉都亚"], ["Tun Perak", "敦霹雳"], ["Parameswara", "拜里米苏拉"], ["Sultan Alauddin Riayat Shah", "苏丹阿拉乌丁利亚沙"]], correct: 0 },
  { bm: "Sultan memerintah negara, Bendahara membantu pentadbiran dan Laksamana menjaga keselamatan perairan. Mengapakah mereka dikenang sebagai tokoh terbilang?", zh: "苏丹治理国家，宰相协助行政，海军统帅维护海域安全。为什么他们被称为杰出人物？", options: [["Mereka memiliki banyak makanan", "他们拥有许多食物"], ["Mereka tinggal di istana yang besar", "他们居住在大型王宫"], ["Mereka memberikan sumbangan kepada kegemilangan Melaka", "他们为马六甲的辉煌作出了贡献"], ["Mereka selalu mengembara ke luar negara", "他们经常前往外国"]], correct: 2 }
];
let unusedQuestions = [];

function finishQuiz(isCorrect) {
  if (phase !== "quiz") return;

  phase = "quiz-result";
  answeredQuestions += 1;

  if (isCorrect) {
    correctQuestions += 1;
    score += 100;
    sfxManager.playSFX("quizCorrect");
    sfxManager.later(80, () => sfxManager.playSFX("royalStamp"));
    sfxManager.later(165, () => sfxManager.playSFX("coin"));
  } else {
    sfxManager.playSFX("quizWrong");
  }

  quizFeedback.textContent = isCorrect
    ? language === "zh"
      ? "✓ 回答正确！"
      : language === "bm"
        ? "✓ Jawapan betul!"
        : "✓ Jawapan betul!｜回答正确！"
    : language === "zh"
      ? "✗ 已记录，继续下一单。"
      : language === "bm"
        ? "✗ Direkodkan. Teruskan pesanan seterusnya."
        : "✗ Direkodkan. Teruskan pesanan seterusnya.｜已记录，继续下一单。";

  ui();

  setTimeout(() => {
    quizScreen.classList.remove("visible");

    if (answeredQuestions === quizBank.length) {
      showEndScreen();
      return;
    }

    gameScreen.classList.add("visible");

    selected = [];
    phase = "grill";
    orderNumber += 1;
    currentOrder = [...orderPatterns[(orderNumber - 1) % orderPatterns.length]];
    document.querySelector("#flatbreadToppings").innerHTML = "";
    instruction.textContent = languageText[language].grill;
    ui();
    createFoodLabels();
    sfxManager.playSFX("newOrder");
  }, 1200);
}

function showEndScreen() {
  sfxManager.stopAllLoopSFX();
  sfxManager.playSFX("levelComplete");
  const wrongQuestions = answeredQuestions - correctQuestions;
  const accuracy = Math.round((correctQuestions / quizBank.length) * 100);
  const isChinese = language === "zh";
  const isMalay = language === "bm";

  endTitle.textContent = isChinese
    ? "恭喜！你成为马六甲皇家厨师！"
    : isMalay
      ? "Tahniah! Anda menjadi Cef Diraja Melaka!"
      : "Tahniah! Anda menjadi Cef Diraja Melaka!｜恭喜！你成为马六甲皇家厨师！";
  endSubtitle.textContent = isChinese
    ? "你已完成全部 20 道杰出人物题目。"
    : isMalay
      ? "Anda telah melengkapkan semua 20 soalan tokoh terbilang."
      : "Anda telah melengkapkan semua 20 soalan tokoh terbilang.｜你已完成全部 20 道杰出人物题目。";

  endScoreLabel.textContent = isChinese ? "总分" : isMalay ? "SKOR" : "SKOR｜总分";
  endCoinLabel.textContent = isChinese ? "金币" : isMalay ? "SYILING" : "SYILING｜金币";
  endCorrectLabel.textContent = isChinese ? "答对题数" : isMalay ? "JAWAPAN BETUL" : "JAWAPAN BETUL｜答对题数";
  endWrongLabel.textContent = isChinese ? "答错题数" : isMalay ? "JAWAPAN SALAH" : "JAWAPAN SALAH｜答错题数";
  endRateLabel.textContent = isChinese ? "正确率" : isMalay ? "KETEPATAN" : "KETEPATAN｜正确率";
  restartButton.textContent = isChinese ? "再玩一次" : isMalay ? "MAIN LAGI" : "MAIN LAGI｜再玩一次";

  endScore.textContent = score;
  endCoins.textContent = coins;
  endCorrect.textContent = `${correctQuestions} / ${quizBank.length}`;
  endWrong.textContent = wrongQuestions;
  endRate.textContent = `${accuracy}%`;
  endScreen.classList.add("visible");
}
ui();

/* Draw one unused question per completed order. */
function showQuiz() {
  sfxManager.stopAllLoopSFX();
  if (unusedQuestions.length === 0) {
    unusedQuestions = quizBank.map((_, index) => index).sort(() => Math.random() - 0.5);
  }

  const item = quizBank[unusedQuestions.pop()];
  const formatOption = ([bm, zh]) => {
    if (language === "zh") return zh;
    if (language === "bm") return bm;

    return `${bm}｜${zh}`;
  };
  const correct = formatOption(item.options[item.correct]);
  const prompt = language === "zh"
    ? item.zh
    : language === "bm"
      ? item.bm
      : `${item.bm}｜${item.zh}`;
  const title = language === "zh" ? "人物问答" : language === "bm" ? "KUIZ TOKOH" : "KUIZ TOKOH｜人物问答";
  const wrong = item.options
    .filter((option, index) => index !== item.correct)
    .map(formatOption);

  gameScreen.classList.remove("visible");
  quizScreen.classList.add("visible");
  quizTitle.textContent = title;
  questionText.textContent = prompt;
  quizFeedback.textContent = "";
  answers.innerHTML = "";

  [correct, ...wrong].sort(() => Math.random() - 0.5).forEach(answer => {
    const button = document.createElement("button");
    button.textContent = answer;
    button.onclick = () => {
      sfxManager.playSFX("buttonClick");
      finishQuiz(answer === correct);
    };
    answers.append(button);
  });

  phase = "quiz";
}

const settingsScreen = document.querySelector("#settingsScreen");
const settingsButton = document.querySelector("#settingsButton");
const gameSettingsButton = document.querySelector("#gameSettingsButton");
const closeSettingsButton = document.querySelector("#closeSettingsButton");
const sfxToggle = document.querySelector("#sfxToggle");
const sfxVolume = document.querySelector("#sfxVolume");
const sfxValue = document.querySelector("#sfxValue");

function refreshSFXSettings() {
  sfxToggle.checked = sfxManager.enabled;
  sfxVolume.value = Math.round(sfxManager.volume * 100);
  sfxValue.textContent = `${sfxVolume.value}%`;
}

function openSFXSettings() {
  sfxManager.playSFX("buttonClick");
  refreshSFXSettings();
  settingsScreen.classList.add("visible");
  settingsScreen.setAttribute("aria-hidden", "false");
}

function closeSFXSettings() {
  sfxManager.playSFX("buttonClick");
  settingsScreen.classList.remove("visible");
  settingsScreen.setAttribute("aria-hidden", "true");
}

settingsButton.onclick = openSFXSettings;
gameSettingsButton.onclick = openSFXSettings;
closeSettingsButton.onclick = closeSFXSettings;
sfxToggle.onchange = () => {
  sfxManager.toggleSFX(sfxToggle.checked);
  if (sfxToggle.checked) sfxManager.playSFX("buttonConfirm");
};
sfxVolume.oninput = () => {
  sfxManager.setSFXVolume(Number(sfxVolume.value) / 100);
  sfxValue.textContent = `${sfxVolume.value}%`;
};
settingsScreen.onclick = event => {
  if (event.target === settingsScreen) closeSFXSettings();
};

document.addEventListener("visibilitychange", () => {
  if (document.hidden) sfxManager.pauseSFX();
  else sfxManager.resumeSFX();
});

refreshSFXSettings();

