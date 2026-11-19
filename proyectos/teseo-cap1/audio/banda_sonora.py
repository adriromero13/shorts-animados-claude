# Banda sonora original de «Teseo y el laberinto» (74,6 s): música y efectos sintetizados con el kit de la plantilla
# (plantillas/audio: dsp.py, instruments.py, sfx_gen.py), mezclados bajo la voz y llevados a -14 LUFS.
# Uso: python banda_sonora.py   ->  mezcla_final.wav (voz + música + efectos), stem_musica.wav, stem_efectos.wav
import os, sys, json
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "plantillas", "audio"))
from dsp import SR, ns, tt, rng, lp, hp, bp, colored, smooth_noise, ramp, fades, place, make_ir, convolve_st, dbg, \
    read_wav, write_wav, integrated, true_peak, st, phase
from instruments import m2f, pad, pluck, glock, vibes, musicbox, timpani, cymbal
from sfx_gen import whoosh, stroll_step, hammer_hit, clink
from mix import limiter

FPS = 30
W = json.load(open(os.path.join(HERE, "..", "palabras.json")))
DUR = W["duracion"] + 0.15
N = ns(DUR)
F = lambda f: f / FPS  # cuadro -> segundos
r = rng(7)

mus = np.zeros((2, N)); fx = np.zeros((2, N))

# ---------------- MÚSICA (re menor; mayor en Atenas y al amanecer) ----------------
D2, A2, F2, B1 = 38, 45, 41, 35
def chord(root, minor=True):
    return [m2f(root), m2f(root + (3 if minor else 4)), m2f(root + 7), m2f(root + 12)]

def bed(t0, t1, roots, minor, vel=0.35, warm=900):
    """pad que cambia de acorde a partes iguales entre t0 y t1"""
    seg = (t1 - t0) / len(roots)
    for i, (ro, mi) in enumerate(zip(roots, minor)):
        place(mus, pad(chord(ro + 12, mi), seg + 0.4, vel=vel, r=r, att=0.4, rel=0.8, warm=warm), t0 + i * seg)

def ostinato(t0, t1, notes, step, vel=0.45, bright=0.4):
    t, k = t0, 0
    while t < t1:
        place(mus, pluck(m2f(notes[k % len(notes)]), vel=vel, r=r, dur=0.6, bright=bright), t); t += step; k += 1

def melody(t0, notes, step, fn=glock, vel=0.4):
    for i, n in enumerate(notes):
        if n is not None: place(mus, fn(m2f(n), vel=vel, r=r), t0 + i * step)

# 1. gancho (0-6.4 s): tensión, ostinato grave, golpes de timbal en «toro» y «él»
bed(0, F(191), [D2, D2, B1 + 12 - 12, A2], [True, True, False, True], vel=0.3, warm=700)
ostinato(0.1, F(185), [50, 53, 57, 53, 52, 53, 57, 60], 0.2, vel=0.5)
place(mus, timpani(m2f(D2), vel=0.9, r=r), F(55)); place(mus, timpani(m2f(A2 - 12), vel=1.0, r=r), F(184))
# 2. Atenas (6.4-16.2 s): luminoso, re mayor, glockenspiel
bed(F(191), F(487), [D2, 43, A2, D2], [False, False, False, False], vel=0.28, warm=1200)
melody(F(200), [74, 76, 78, 81, None, 79, 78, 76, 74, None, 76, 78, 81, 83, 81, None], 0.32)
ostinato(F(287), F(480), [62, 66, 69, 66], 0.25, vel=0.35, bright=0.6)
# 3. Creta y el laberinto (16.2-35.4 s): oscuro, timbal lento
bed(F(487), F(1063), [D2, 46, F2, A2, D2, 46], [True, False, False, True, True, False], vel=0.32, warm=750)
for k, f in enumerate(range(499, 1063, 30)): place(mus, timpani(m2f(D2), vel=0.35 + 0.1 * (k % 2), r=r, dur=1.2), F(f))
place(mus, timpani(m2f(D2), vel=1.0, r=r), F(650))                                       # «Ninguno vuelve»
melody(F(767), [69, 68, 67, 66, 65], 0.22, fn=pluck, vel=0.5)                            # Dédalo, perdido
melody(F(995), [74, 77, 81], 0.25, fn=musicbox, vel=0.5)                                 # el ovillo
# 4. a oscuras (35.4-40.6 s): dron grave; en «Espera…» silencio total
dron = pad([m2f(26), m2f(33)], F(1217) - F(1063), vel=0.45, r=r, att=0.8, rel=0.15, warm=300)
place(mus, dron, F(1063))
# 5. Fíjate (42.9-70.3 s): música de reflexión, vibráfono
bed(F(1288), F(1597), [D2, 46, F2, A2], [True, False, False, True], vel=0.26, warm=1000)
melody(F(1300), [62, 65, 69, 72, 69, 65, 64, 65, 62, None, 65, 69, 74, 72, 69, 67], 0.6, fn=vibes, vel=0.3)
bed(F(1597), F(1823), [D2, D2, 46, A2], [True, True, False, True], vel=0.3, warm=600)     # el Minotauro: latido
for f in range(1600, 1823, 22): place(mus, timpani(m2f(D2 - 12 + 12), vel=0.5, r=r, dur=0.6), F(f))
for f in (1671, 1701, 1728): place(mus, timpani(m2f(A2 - 12), vel=0.8, r=r, dur=1.0), F(f))
bed(F(1823), F(1974), [46, F2, 43, A2], [False, False, False, False], vel=0.3, warm=1300)  # el Teseo interior
place(mus, cymbal(vel=0.35, r=r, dur=2.6, bright=0.8), F(1868))
melody(F(1871), [69, 74, 78, 81], 0.18, fn=glock, vel=0.45)
bed(F(1974), F(2111), [D2, 46, A2, D2], [True, False, True, False], vel=0.3, warm=800)
# 6. amanecer (70.3-74.6 s): resolución en re mayor; acaba con la última palabra
bed(F(2111), F(2238) - 0.25, [43, A2, D2], [False, False, False], vel=0.3, warm=1400)
melody(F(2117), [74, 78, 81, 86], 0.45, fn=glock, vel=0.45)

# ---------------- EFECTOS ----------------
def sfx(x, t, g=1.0): place(fx, x, t, g)
# giros de cámara en el gancho
for f in (30, 62, 95, 128): sfx(whoosh(0.5, r, peak=0.4), F(f), 0.5)
# Atenas: la roca sube (esfuerzo), cae lejos (golpe), la espada sale (brillo metálico)
sfx(hammer_hit(r, big=1.6), F(366), 0.9)
sfx(clink(r, f0=2600, dur=0.5, bright=1.4), F(379), 0.6); sfx(whoosh(0.35, r, peak=0.2, f_lo=1500, f_hi=6000), F(375), 0.5)
for f in (410, 440, 470): sfx(glock(m2f(96), vel=0.25, r=r), F(f), 0.4)                     # estrellitas
# Creta: olas y gaviotas no; viento y la puerta
wind = bp(colored(ns(F(1063) - F(487)), r, 1.0), 200, 1200, 1) * smooth_noise(ns(F(1063) - F(487)), r, 0.3) * 0.12
sfx(wind, F(487), 1.0)
sfx(whoosh(1.4, r, peak=0.5), F(668), 0.7); sfx(whoosh(1.2, r, peak=0.4), F(775), 0.6)   # subida y picado
# antorcha: crepitar y pasos hasta «Espera»
n = ns(F(1217) - F(1063))
crack = hp(colored(n, r, 0.0), 1500) * (r.random(n) < 0.0009).astype(float) * 2 + bp(colored(n, r, 1.2), 100, 600, 1) * 0.08
sfx(crack, F(1063), 0.5)
for f in range(1070, 1217, 11): sfx(stroll_step(r, 0.3), F(f), 0.35)
# la respiración enorme (1168-1214): ruido grave que se hincha y se deshincha
for k, f in enumerate((1170, 1192)):
    d = 0.75; x = lp(colored(ns(d), r, 1.5), 400) * np.sin(np.linspace(0, np.pi, ns(d))) ** 2 * 0.9
    sfx(x, F(f), 1.0)
# el Minotauro crece (whoosh grave que sube) y se encoge (glissando que baja + «pop»)
sfx(whoosh(1.3, r, peak=0.8, f_lo=120, f_hi=900), F(1988), 0.8)
sfx(whoosh(1.2, r, peak=0.2, f_lo=1800, f_hi=200), F(2057), 0.7)
sfx(pluck(m2f(84), vel=0.6, r=r, dur=0.3, bright=0.9), F(2098), 0.5)
# las pantallas y el bocadillo: avisos suaves
for f in (1444, 1498): sfx(musicbox(m2f(88), vel=0.3, r=r, dur=0.6), F(f), 0.5)
sfx(whoosh(1.0, r, peak=0.4), F(1287), 0.6)                                                 # atravesamos la pared

# ---------------- MEZCLA ----------------
ir = make_ir(1.6, 3, hf=0.6)
mus = mus + 0.25 * convolve_st(mus, ir)[:, :N]
v, sr = read_wav(os.path.join(HERE, "voz_final.wav"))
assert sr == SR, sr
voz = st(v)[:, :N]; voz = np.pad(voz, ((0, 0), (0, N - voz.shape[1])))
# la música baja 4 dB mientras se habla (clave = palabras.json)
duck = np.zeros(N)
for w in W["palabras"]: duck[ns(w["inicio"] - 0.08): ns(w["fin"] + 0.15)] = 1
k = ns(0.12); duck = np.convolve(duck, np.ones(k) / k, mode="same")
mus *= dbg(-4 * duck)[None, :]
# silencio musical en «Espera…» hasta la entrada de «Fíjate»
gate = np.ones(N); a, b = ns(F(1217)), ns(F(1288)); gate[a:b] = 0; gate[a:a + ns(0.08)] = ramp(ns(0.08))[::-1]
mus *= gate[None, :]
lv = integrated(voz)
mus *= dbg(lv - 11.0 - integrated(mus))
fx *= dbg(lv - 14.0 - integrated(fx))
mix = voz + mus + fx
mix *= dbg(-14.0 - integrated(mix))
mix, g = limiter(mix, -1.0)
mix = fades(mix.T, 0.005, 0.03).T if mix.shape[0] != 2 else mix
write_wav(os.path.join(HERE, "mezcla_final.wav"), mix)
write_wav(os.path.join(HERE, "stem_musica.wav"), mus)
write_wav(os.path.join(HERE, "stem_efectos.wav"), fx)
print(f"voz {lv:.1f} LUFS | música {integrated(mus):.1f} | efectos {integrated(fx):.1f} | mezcla {integrated(mix):.1f} LUFS, pico {true_peak(mix):.1f} dBTP, reducción máx {20*np.log10(g.min()):.1f} dB")
