// Sons da urna gerados com a Web Audio API (sem arquivos de áudio)
let contexto = null

function obterContexto() {
  if (!contexto) {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return null
    contexto = new AudioContext()
  }
  if (contexto.state === 'suspended') contexto.resume()
  return contexto
}

function tocar(frequencia, inicio, duracao, volume = 0.15) {
  const ctx = obterContexto()
  if (!ctx) return
  const oscilador = ctx.createOscillator()
  const ganho = ctx.createGain()
  oscilador.type = 'square'
  oscilador.frequency.value = frequencia
  ganho.gain.value = volume
  oscilador.connect(ganho)
  ganho.connect(ctx.destination)
  const t = ctx.currentTime + inicio
  oscilador.start(t)
  oscilador.stop(t + duracao)
}

// Bipe curto ao apertar uma tecla
export function somTecla() {
  tocar(1100, 0, 0.07)
}

// Som de erro (tecla inválida)
export function somErro() {
  tocar(300, 0, 0.18)
}

// O conhecido som de fim de votação
export function somFim() {
  for (let i = 0; i < 5; i++) {
    tocar(1500, i * 0.11, 0.07)
    tocar(1900, i * 0.11 + 0.055, 0.05)
  }
  tocar(1500, 0.6, 0.25)
}
