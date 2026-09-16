import type { PrismaClient } from '../../generated/prisma/client';
import { buildMovementSearchText } from './helpers';

export const movementSeedLocales = ['en', 'es', 'pt'] as const;

type SeedLocale = (typeof movementSeedLocales)[number];

type MovementTranslations = Record<SeedLocale, string>;

export type MovementSeed = {
  name: string;
  categoryKey: 'WEIGHTLIFTING' | 'GYMNASTICS' | 'MONOSTRUCTURAL' | 'OTHER';
  measurementTypeKeys: readonly ('REPS' | 'WEIGHT' | 'DISTANCE' | 'DURATION' | 'CALORIES')[];
  isFoundational: boolean;
  aliases: readonly string[];
  baseMovementName?: string;
  description: string;
  videoUrl?: string;
};

const movementTranslations: Record<string, MovementTranslations> = {
  'AbMat Sit-up': {
    en: 'Sit with the soles of the feet together and an AbMat supporting the lower back. Lie back until the shoulders contact the floor, then flex the trunk to sit up and touch the feet.',
    es: 'Siéntate con las plantas de los pies juntas y el AbMat apoyando la zona lumbar. Recuéstate hasta que los hombros toquen el suelo y luego flexiona el tronco para incorporarte y tocar los pies.',
    pt: 'Sente-se com as solas dos pés juntas e o AbMat apoiando a região lombar. Deite até os ombros tocarem o chão e depois flexione o tronco para sentar e tocar os pés.',
  },
  'Air Squat': {
    en: 'Stand with the feet about shoulder-width apart. Send the hips back and down, keep the chest upright and knees tracking over the toes, descend below parallel, then stand to full hip and knee extension.',
    es: 'Párate con los pies aproximadamente al ancho de los hombros. Lleva las caderas hacia atrás y abajo, mantén el pecho erguido y las rodillas alineadas con los pies, baja por debajo del paralelo y vuelve a extender completamente caderas y rodillas.',
    pt: 'Fique em pé com os pés aproximadamente na largura dos ombros. Leve o quadril para trás e para baixo, mantenha o peito erguido e os joelhos alinhados com os pés, desça abaixo do paralelo e volte à extensão completa de quadril e joelhos.',
  },
  'Back Scale': {
    en: 'Balance on one leg while extending the other leg behind the body. Hinge forward with a braced trunk until the torso and raised leg form a long controlled line, then return to standing.',
    es: 'Equilíbrate sobre una pierna mientras extiendes la otra hacia atrás. Inclina el torso hacia delante con el abdomen firme hasta formar una línea larga y controlada, y luego vuelve a la posición de pie.',
    pt: 'Equilibre-se sobre uma perna enquanto estende a outra para trás. Incline o tronco à frente com o core firme até formar uma linha longa e controlada e depois volte à posição em pé.',
  },
  'Back Squat': {
    en: 'Support a barbell across the upper back, brace the trunk, and squat until the hip crease passes below the knees. Drive through the feet to return to full standing extension.',
    es: 'Apoya la barra sobre la parte superior de la espalda, estabiliza el tronco y baja en sentadilla hasta que la cadera quede por debajo de las rodillas. Empuja el suelo para volver a la extensión completa.',
    pt: 'Apoie a barra na parte superior das costas, estabilize o tronco e agache até o quadril ficar abaixo dos joelhos. Empurre o chão para voltar à extensão completa.',
  },
  'Barbell Front-rack Lunge': {
    en: 'Hold a barbell in the front-rack position. Step into a lunge, lower the rear knee toward the floor while keeping the torso upright, then drive through the front foot to stand and continue.',
    es: 'Da el paso o desplazamiento indicado y baja la rodilla trasera hacia el suelo manteniendo el torso estable. Empuja con la pierna delantera para volver a ponerte de pie y continúa según lo prescrito.',
    pt: 'Dê o passo ou deslocamento indicado e desça o joelho de trás em direção ao chão mantendo o tronco estável. Empurre com a perna da frente para voltar a ficar em pé e continue conforme prescrito.',
  },
  'Bench Press': {
    en: 'Lie on a bench with the feet planted and shoulder blades set. Lower the bar under control to the chest, then press it upward until the elbows are fully extended.',
    es: 'Acuéstate en el banco con los pies firmes y las escápulas estables. Baja la barra de forma controlada hasta el pecho y luego empújala hasta extender completamente los codos.',
    pt: 'Deite no banco com os pés firmes no chão e as escápulas estáveis. Desça a barra com controle até o peito e depois empurre até estender completamente os cotovelos.',
  },
  'Box Jump': {
    en: 'Stand facing a stable box, dip through the hips and knees, then jump with both feet onto the box. Land under control and reach full hip and knee extension before stepping or jumping down.',
    es: 'Párate frente a un cajón estable, flexiona caderas y rodillas y salta con ambos pies sobre el cajón. Aterriza con control y alcanza la extensión completa antes de bajar.',
    pt: 'Fique de frente para uma caixa estável, flexione quadril e joelhos e salte com os dois pés sobre a caixa. Aterrisse com controle e alcance a extensão completa antes de descer.',
  },
  'Box Step-up': {
    en: 'Place one foot fully on the box and drive through that leg to stand on top. Reach full extension, then step down under control and repeat as prescribed.',
    es: 'Coloca un pie completamente sobre el cajón y empuja con esa pierna para subir. Alcanza la extensión completa y baja de forma controlada antes de repetir.',
    pt: 'Coloque um pé inteiro sobre a caixa e empurre com essa perna para subir. Alcance a extensão completa e desça com controle antes de repetir.',
  },
  'Burpee': {
    en: 'From standing, place the hands on the floor and move the feet back until the chest and thighs contact the ground. Return the feet under the body and finish by jumping with the hips and knees extended.',
    es: 'Desde la posición de pie, lleva las manos al suelo y desplaza los pies hacia atrás hasta que el pecho y los muslos toquen el piso. Vuelve a llevar los pies debajo del cuerpo y termina con un salto en extensión.',
    pt: 'A partir da posição em pé, coloque as mãos no chão e leve os pés para trás até o peito e as coxas tocarem o solo. Traga os pés de volta para baixo do corpo e finalize com um salto em extensão.',
  },
  'Burpee Box Jump-over': {
    en: 'Perform a burpee beside or facing a box, then jump onto or over the box and travel to the opposite side. Land with control and begin the next repetition.',
    es: 'Realiza Burpee Box Jump-over con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Burpee Box Jump-over com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Butterfly Pull-up': {
    en: 'Hang from the bar and use a continuous circular kip to move the chest toward the bar. Pull until the chin clears the bar, then push away and cycle directly into the next repetition.',
    es: 'Desde una suspensión con los brazos extendidos, tira del cuerpo hasta alcanzar la altura requerida y vuelve de forma controlada a la extensión completa, utilizando kip solo cuando la variante lo indique.',
    pt: 'A partir de uma suspensão com os braços estendidos, puxe o corpo até atingir a altura exigida e retorne com controle à extensão completa, usando kip somente quando a variante indicar.',
  },
  'Chest-to-wall Handstand Push-up': {
    en: 'Kick or walk into a handstand facing the wall. Lower the head under control while maintaining a tight body line, then press back to locked elbows in the inverted position.',
    es: 'Desde una posición de handstand estable, baja la cabeza de forma controlada y vuelve a empujar hasta extender completamente los codos. Respeta la variante indicada, ya sea estricta, con kip, déficit o libre.',
    pt: 'A partir de uma posição de handstand estável, desça a cabeça com controle e empurre novamente até estender completamente os cotovelos. Respeite a variante indicada: estrita, com kip, déficit ou livre.',
  },
  'Clean': {
    en: 'Lift the bar from the floor, accelerate it with powerful hip and leg extension, then pull under and receive it on the shoulders in a front squat. Stand to full extension to finish.',
    es: 'Levanta la barra desde el suelo, acelérala con una extensión potente de caderas y piernas y pasa por debajo para recibirla sobre los hombros en sentadilla frontal. Ponte completamente de pie para finalizar.',
    pt: 'Levante a barra do chão, acelere com uma extensão potente de quadril e pernas e entre sob a barra para recebê-la nos ombros em um agachamento frontal. Fique completamente em pé para finalizar.',
  },
  'Clean and Jerk': {
    en: 'Clean the bar from the floor to the shoulders, stand fully, then dip and drive to send the bar overhead. Receive it with locked arms and finish with the feet together and body fully extended.',
    es: 'Realiza un clean llevando la barra del suelo a los hombros, ponte completamente de pie y luego usa una flexión e impulso de piernas para llevarla sobre la cabeza. Recíbela con los brazos extendidos y finaliza estable.',
    pt: 'Faça o clean levando a barra do chão aos ombros, fique completamente em pé e depois use uma flexão e impulsão das pernas para levar a barra acima da cabeça. Receba com os braços estendidos e finalize estável.',
  },
  'Clean and Push Jerk': {
    en: 'Clean the bar to the shoulders, stand fully, then use a vertical dip and drive to elevate the bar. Re-dip under it and receive overhead with locked arms before standing tall.',
    es: 'Lleva la barra desde la posición indicada hasta los hombros usando una extensión potente de piernas y caderas. Pasa debajo para recibirla con control y ponte completamente de pie para finalizar.',
    pt: 'Leve a barra da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a barra para recebê-la com controle e fique completamente em pé para finalizar.',
  },
  'Deadlift': {
    en: 'Stand over the bar with a braced neutral spine, grip outside the legs, and drive through the floor while extending the knees and hips. Finish standing tall with the bar at the hips.',
    es: 'Párate sobre la barra con la columna neutra y el tronco firme, agarra la barra por fuera de las piernas y empuja el suelo mientras extiendes rodillas y caderas. Finaliza de pie con la barra a la altura de las caderas.',
    pt: 'Posicione-se sobre a barra com a coluna neutra e o tronco firme, segure a barra por fora das pernas e empurre o chão enquanto estende joelhos e quadril. Finalize em pé com a barra na altura do quadril.',
  },
  'Dip': {
    en: 'Support the body on parallel bars with straight arms. Lower until the shoulders descend below the elbows, then press back to full elbow extension while keeping the body controlled.',
    es: 'Sostén el cuerpo sobre barras paralelas con los brazos extendidos. Baja hasta que los hombros queden por debajo de los codos y luego empuja hasta volver a la extensión completa.',
    pt: 'Sustente o corpo nas barras paralelas com os braços estendidos. Desça até os ombros ficarem abaixo dos cotovelos e depois empurre até voltar à extensão completa.',
  },
  'Double-under': {
    en: 'Jump vertically with a relaxed body while turning the rope quickly enough for it to pass under the feet twice during each jump. Land softly and maintain a consistent rhythm.',
    es: 'Salta verticalmente con el cuerpo relajado mientras haces girar la cuerda lo suficientemente rápido para que pase dos veces por debajo de los pies en cada salto. Aterriza suavemente y mantén un ritmo constante.',
    pt: 'Salte verticalmente com o corpo relaxado enquanto gira a corda rápido o suficiente para ela passar duas vezes sob os pés em cada salto. Aterrisse suavemente e mantenha um ritmo constante.',
  },
  'Dumbbell Clean': {
    en: 'Start with the dumbbell or dumbbells below the hips, extend the legs and hips powerfully, then pull under and receive the load at the shoulders. Stand fully to complete the repetition.',
    es: 'Mueve la mancuerna o las mancuernas desde la posición indicada hasta los hombros mediante una extensión potente de piernas y caderas. Pasa debajo de la carga, recíbela con control y ponte completamente de pie.',
    pt: 'Mova o halter ou os halteres da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a carga, receba com controle e fique completamente em pé.',
  },
  'Dumbbell Deadlift': {
    en: 'Start with the dumbbells beside the feet, brace the trunk, and drive through the floor while extending the knees and hips. Finish standing tall with the dumbbells at the sides.',
    es: 'Realiza Dumbbell Deadlift con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Dumbbell Deadlift com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Dumbbell Farmers Carry': {
    en: 'Hold a dumbbell in each hand at the sides, stand tall with the trunk braced, and walk the prescribed distance or time while keeping the shoulders stable and the loads controlled.',
    es: 'Sostén la carga en la posición indicada, mantén el tronco firme y camina la distancia o el tiempo prescrito conservando una postura estable y la carga bajo control.',
    pt: 'Segure a carga na posição indicada, mantenha o tronco firme e caminhe pela distância ou tempo prescritos, conservando uma postura estável e a carga sob controle.',
  },
  'Dumbbell Front-rack Lunge': {
    en: 'Hold the dumbbells at the shoulders, step into a lunge, and lower the rear knee toward the floor. Keep the torso upright and drive through the front foot to return to standing.',
    es: 'Sostén la mancuerna o las mancuernas en la posición indicada y avanza en una zancada controlada. Baja la rodilla trasera hacia el suelo y empuja con la pierna delantera para continuar.',
    pt: 'Segure o halter ou os halteres na posição indicada e avance em uma passada controlada. Desça o joelho de trás em direção ao chão e empurre com a perna da frente para continuar.',
  },
  'Dumbbell Front Squat': {
    en: 'Hold the dumbbells at the shoulders, brace the trunk, and squat below parallel while keeping the chest upright. Drive through the feet to stand to full extension.',
    es: 'Sostén la mancuerna o las mancuernas en la posición indicada, estabiliza el tronco y baja en sentadilla por debajo del paralelo. Mantén la carga controlada y vuelve a la extensión completa.',
    pt: 'Segure o halter ou os halteres na posição indicada, estabilize o tronco e agache abaixo do paralelo. Mantenha a carga controlada e volte à extensão completa.',
  },
  'Dumbbell Hang Clean': {
    en: 'Start standing with the dumbbells, hinge to the hang position, then extend the hips and knees aggressively. Pull under and receive the dumbbells at the shoulders before standing tall.',
    es: 'Mueve la mancuerna o las mancuernas desde la posición indicada hasta los hombros mediante una extensión potente de piernas y caderas. Pasa debajo de la carga, recíbela con control y ponte completamente de pie.',
    pt: 'Mova o halter ou os halteres da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a carga, receba com controle e fique completamente em pé.',
  },
  'Dumbbell Hang Power Clean': {
    en: 'Start with the dumbbells at the hang, extend the hips and knees powerfully, then pull under and receive the loads at the shoulders in a partial squat. Stand fully to finish.',
    es: 'Mueve la mancuerna o las mancuernas desde la posición indicada hasta los hombros mediante una extensión potente de piernas y caderas. Pasa debajo de la carga, recíbela con control y ponte completamente de pie.',
    pt: 'Mova o halter ou os halteres da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a carga, receba com controle e fique completamente em pé.',
  },
  'Dumbbell Overhead Squat': {
    en: 'Hold a dumbbell locked out overhead, brace the trunk, and squat below parallel while keeping the load stacked over the shoulder. Stand to full extension without losing the overhead position.',
    es: 'Sostén la mancuerna o las mancuernas en la posición indicada, estabiliza el tronco y baja en sentadilla por debajo del paralelo. Mantén la carga controlada y vuelve a la extensión completa.',
    pt: 'Segure o halter ou os halteres na posição indicada, estabilize o tronco e agache abaixo do paralelo. Mantenha a carga controlada e volte à extensão completa.',
  },
  'Dumbbell Overhead Walking Lunge': {
    en: 'Lock the dumbbell or dumbbells overhead and walk forward through controlled lunges. Lower the rear knee toward the floor on each step while maintaining a stable overhead position.',
    es: 'Sostén la mancuerna o las mancuernas en la posición indicada y avanza en una zancada controlada. Baja la rodilla trasera hacia el suelo y empuja con la pierna delantera para continuar.',
    pt: 'Segure o halter ou os halteres na posição indicada e avance em uma passada controlada. Desça o joelho de trás em direção ao chão e empurre com a perna da frente para continuar.',
  },
  'Dumbbell Power Clean': {
    en: 'Lift the dumbbells from the floor, extend the hips and knees explosively, then pull under and receive them at the shoulders in a partial squat. Stand fully to complete the rep.',
    es: 'Mueve la mancuerna o las mancuernas desde la posición indicada hasta los hombros mediante una extensión potente de piernas y caderas. Pasa debajo de la carga, recíbela con control y ponte completamente de pie.',
    pt: 'Mova o halter ou os halteres da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a carga, receba com controle e fique completamente em pé.',
  },
  'Dumbbell Power Snatch': {
    en: 'Move the dumbbell from the floor to overhead in one continuous motion using powerful hip and leg extension. Receive it overhead with a locked arm in a partial squat, then stand tall.',
    es: 'Mueve la mancuerna desde la posición indicada hasta sobre la cabeza en un movimiento continuo, usando una extensión potente de piernas y caderas. Recíbela con el brazo extendido y estabiliza antes de finalizar.',
    pt: 'Mova o halter da posição indicada até acima da cabeça em um movimento contínuo, usando uma extensão potente de pernas e quadril. Receba com o braço estendido e estabilize antes de finalizar.',
  },
  'Dumbbell Push Jerk': {
    en: 'Hold the dumbbells at the shoulders, dip and drive through the legs, then re-dip under the rising loads. Receive them overhead with locked arms and stand to full extension.',
    es: 'Sostén las mancuernas sobre los hombros y utiliza la técnica indicada para llevarlas sobre la cabeza. Finaliza con los brazos completamente extendidos, el cuerpo estable y la carga bajo control.',
    pt: 'Segure os halteres nos ombros e use a técnica indicada para levá-los acima da cabeça. Finalize com os braços completamente estendidos, o corpo estável e a carga sob controle.',
  },
  'Dumbbell Push Press': {
    en: 'Hold the dumbbells at the shoulders, perform a shallow vertical dip, then extend the legs and hips to drive the loads overhead. Finish with the elbows locked without re-bending the knees.',
    es: 'Sostén las mancuernas sobre los hombros y utiliza la técnica indicada para llevarlas sobre la cabeza. Finaliza con los brazos completamente extendidos, el cuerpo estable y la carga bajo control.',
    pt: 'Segure os halteres nos ombros e use a técnica indicada para levá-los acima da cabeça. Finalize com os braços completamente estendidos, o corpo estável e a carga sob controle.',
  },
  'Dumbbell Squat Snatch': {
    en: 'Move the dumbbell from the floor to overhead in one motion, pulling under it into a full squat. Stabilize the load overhead and stand to full hip and knee extension.',
    es: 'Mueve la mancuerna desde la posición indicada hasta sobre la cabeza en un movimiento continuo, usando una extensión potente de piernas y caderas. Recíbela con el brazo extendido y estabiliza antes de finalizar.',
    pt: 'Mova o halter da posição indicada até acima da cabeça em um movimento contínuo, usando uma extensão potente de pernas e quadril. Receba com o braço estendido e estabilize antes de finalizar.',
  },
  'Dumbbell Thruster': {
    en: 'Hold the dumbbells at the shoulders and descend into a front squat. Drive out of the squat and transfer the leg and hip extension directly into an overhead press to locked arms.',
    es: 'Realiza Dumbbell Thruster con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Dumbbell Thruster com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Dumbbell Turkish Get-up': {
    en: 'Begin lying on the floor with one dumbbell locked out above the shoulder. Move through supported sitting, kneeling, and standing positions while keeping the load overhead, then reverse the sequence under control.',
    es: 'Realiza Dumbbell Turkish Get-up con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Dumbbell Turkish Get-up com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Forward Roll From Support': {
    en: 'Begin in a supported position on the rings, lean forward while maintaining control, tuck the body and rotate through a forward roll, then return to a stable support position.',
    es: 'Realiza Forward Roll From Support con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Forward Roll From Support com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Freestanding Handstand Push-up': {
    en: 'Balance in a freestanding handstand, lower the head toward the floor under control, then press back to locked elbows while maintaining balance without wall assistance.',
    es: 'Desde una posición de handstand estable, baja la cabeza de forma controlada y vuelve a empujar hasta extender completamente los codos. Respeta la variante indicada, ya sea estricta, con kip, déficit o libre.',
    pt: 'A partir de uma posição de handstand estável, desça a cabeça com controle e empurre novamente até estender completamente os cotovelos. Respeite a variante indicada: estrita, com kip, déficit ou livre.',
  },
  'Front Scale': {
    en: 'Balance on one leg while lifting the other leg straight in front of the body. Keep the torso tall, knee extended, and position controlled for the prescribed time.',
    es: 'Realiza Front Scale con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Front Scale com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Front Squat': {
    en: 'Support the bar on the shoulders in the front rack with elbows high. Squat below parallel while keeping the torso upright, then drive through the feet to stand fully.',
    es: 'Apoya la barra sobre los hombros en posición de front rack con los codos altos. Baja por debajo del paralelo manteniendo el torso erguido y luego empuja el suelo para volver a la posición de pie.',
    pt: 'Apoie a barra nos ombros na posição de front rack, com os cotovelos altos. Agache abaixo do paralelo mantendo o tronco ereto e depois empurre o chão para voltar à posição em pé.',
  },
  'GHD Back Extension': {
    en: 'Set the hips on the GHD pads with the torso free to move. Flex through the spine under control, then extend the back to return to a neutral aligned position.',
    es: 'Realiza GHD Back Extension con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute GHD Back Extension com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'GHD Hip and Back Extension': {
    en: 'Set up on the GHD and lower the torso by flexing at both the hips and spine. Extend the hips and back in sequence until the body returns to a straight supported position.',
    es: 'Realiza GHD Hip and Back Extension con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute GHD Hip and Back Extension com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'GHD Hip, Back, and Hip-back Extension': {
    en: 'Use the GHD to cycle through hip extension, back extension, and combined hip-and-back extension patterns while maintaining control through each prescribed range.',
    es: 'Realiza GHD Hip, Back, and Hip-back Extension con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute GHD Hip, Back, and Hip-back Extension com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'GHD Hip Extension': {
    en: 'Set the hips free of the GHD pads, maintain a rigid neutral spine, and hinge at the hips to lower the torso. Contract the posterior chain to return the body to a straight line.',
    es: 'Realiza GHD Hip Extension con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute GHD Hip Extension com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'GHD Sit-up': {
    en: 'Secure the feet in the GHD, extend the hips and torso backward under control, then aggressively extend the knees and flex the trunk to return and touch the foot pads.',
    es: 'Desde la posición inicial indicada, controla el descenso del tronco y utiliza el abdomen para volver a la posición superior. Mantén el movimiento fluido y completa el rango prescrito.',
    pt: 'A partir da posição inicial indicada, controle a descida do tronco e use o abdômen para voltar à posição superior. Mantenha o movimento fluido e complete a amplitude prescrita.',
  },
  'Glide Kip': {
    en: 'From a bar hang, swing the legs forward and upward while keeping tension through the body, then pull the hips toward the bar and transition to a supported position above it.',
    es: 'Realiza Glide Kip con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Glide Kip com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Good Morning': {
    en: 'Support a bar on the upper back, soften the knees, brace the trunk, and hinge the hips backward while keeping the spine neutral. Squeeze the glutes and extend the hips to stand tall.',
    es: 'Apoya la barra sobre la parte superior de la espalda, flexiona ligeramente las rodillas, estabiliza el tronco y lleva las caderas hacia atrás manteniendo la columna neutra. Extiende las caderas para volver a quedar de pie.',
    pt: 'Apoie a barra na parte superior das costas, flexione levemente os joelhos, estabilize o tronco e leve o quadril para trás mantendo a coluna neutra. Estenda o quadril para voltar à posição em pé.',
  },
  'Handstand': {
    en: 'Kick or press into an inverted position with the hands on the floor. Stack the wrists, shoulders, hips, knees, and ankles while maintaining a tight body and active shoulders.',
    es: 'Sube a una posición invertida con las manos en el suelo. Alinea muñecas, hombros, caderas, rodillas y tobillos mientras mantienes el cuerpo firme y los hombros activos.',
    pt: 'Suba para uma posição invertida com as mãos no chão. Alinhe punhos, ombros, quadril, joelhos e tornozelos enquanto mantém o corpo firme e os ombros ativos.',
  },
  'Handstand Pirouette': {
    en: 'From a stable handstand, shift weight from one hand to the other and step the hands around to rotate the body. Maintain active shoulders and control throughout the turn.',
    es: 'Mantén una posición invertida estable con los hombros activos y el cuerpo firme. Ejecuta el desplazamiento o la transición indicada manteniendo el equilibrio y el control.',
    pt: 'Mantenha uma posição invertida estável com os ombros ativos e o corpo firme. Execute o deslocamento ou a transição indicada mantendo equilíbrio e controle.',
  },
  'Handstand Push-up Variations': {
    en: 'From an inverted handstand position, lower the head toward the floor and press back to locked elbows. The exact setup may be strict, kipping, deficit, wall-supported, or freestanding.',
    es: 'Desde una posición de handstand estable, baja la cabeza de forma controlada y vuelve a empujar hasta extender completamente los codos. Respeta la variante indicada, ya sea estricta, con kip, déficit o libre.',
    pt: 'A partir de uma posição de handstand estável, desça a cabeça com controle e empurre novamente até estender completamente os cotovelos. Respeite a variante indicada: estrita, com kip, déficit ou livre.',
  },
  'Handstand Walk': {
    en: 'Kick into a balanced handstand and shift weight from hand to hand to move forward. Keep the shoulders active, body tight, and hands placed in controlled steps.',
    es: 'Mantén una posición invertida estable con los hombros activos y el cuerpo firme. Ejecuta el desplazamiento o la transición indicada manteniendo el equilibrio y el control.',
    pt: 'Mantenha uma posição invertida estável com os ombros ativos e o corpo firme. Execute o deslocamento ou a transição indicada mantendo equilíbrio e controle.',
  },
  'Hang Clean': {
    en: 'Start with the bar above the floor in the hang position, extend the hips and knees powerfully, then pull under and receive the bar on the shoulders in a squat. Stand fully to finish.',
    es: 'Lleva la barra desde la posición indicada hasta los hombros usando una extensión potente de piernas y caderas. Pasa debajo para recibirla con control y ponte completamente de pie para finalizar.',
    pt: 'Leve a barra da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a barra para recebê-la com controle e fique completamente em pé para finalizar.',
  },
  'Hang Clean and Push Jerk': {
    en: 'Clean the bar from the hang to the shoulders, stand fully, then dip and drive into a push jerk. Receive the bar overhead with locked arms and stand to full extension.',
    es: 'Lleva la barra desde la posición indicada hasta los hombros usando una extensión potente de piernas y caderas. Pasa debajo para recibirla con control y ponte completamente de pie para finalizar.',
    pt: 'Leve a barra da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a barra para recebê-la com controle e fique completamente em pé para finalizar.',
  },
  'Hanging L-sit': {
    en: 'Hang from a pull-up bar with straight arms and lift the straight legs until they are approximately parallel to the floor. Maintain a tight trunk and hold the position.',
    es: 'Mantén los brazos extendidos y el tronco firme mientras elevas las piernas rectas aproximadamente hasta la horizontal. Conserva la posición o realiza la transición indicada con control.',
    pt: 'Mantenha os braços estendidos e o tronco firme enquanto eleva as pernas retas aproximadamente até a horizontal. Sustente a posição ou execute a transição indicada com controle.',
  },
  'Hang Power Clean': {
    en: 'Start with the bar at the hang, extend the hips and knees explosively, then pull under and receive the bar on the shoulders in a partial squat. Stand fully to finish.',
    es: 'Lleva la barra desde la posición indicada hasta los hombros usando una extensión potente de piernas y caderas. Pasa debajo para recibirla con control y ponte completamente de pie para finalizar.',
    pt: 'Leve a barra da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a barra para recebê-la com controle e fique completamente em pé para finalizar.',
  },
  'Hang Power Snatch': {
    en: 'Start with the bar at the hang, extend the hips and knees explosively, then pull under and receive the bar overhead with locked arms in a partial squat. Stand fully to finish.',
    es: 'Lleva la barra desde la posición indicada hasta sobre la cabeza usando una extensión potente de piernas y caderas. Pasa debajo, recíbela con los brazos extendidos y finaliza estable.',
    pt: 'Leve a barra da posição indicada até acima da cabeça usando uma extensão potente de pernas e quadril. Entre sob a barra, receba com os braços estendidos e finalize estável.',
  },
  'Hang Snatch': {
    en: 'Start with the bar above the floor in the hang position, extend the hips and knees powerfully, then pull under and receive the bar overhead in a full squat. Stand to full extension.',
    es: 'Lleva la barra desde la posición indicada hasta sobre la cabeza usando una extensión potente de piernas y caderas. Pasa debajo, recíbela con los brazos extendidos y finaliza estable.',
    pt: 'Leve a barra da posição indicada até acima da cabeça usando uma extensão potente de pernas e quadril. Entre sob a barra, receba com os braços estendidos e finalize estável.',
  },
  'Inverted Burpee': {
    en: 'Roll backward from standing into an inverted position, use momentum and body control to return the feet to the floor, then stand or jump to full extension to complete the repetition.',
    es: 'Realiza Inverted Burpee con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Inverted Burpee com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Kettlebell Snatch': {
    en: 'Swing the kettlebell between the legs, extend the hips powerfully, and guide the bell close to the body. Punch the hand through to finish with the kettlebell stable overhead.',
    es: 'Lleva la barra desde la posición indicada hasta sobre la cabeza usando una extensión potente de piernas y caderas. Pasa debajo, recíbela con los brazos extendidos y finaliza estable.',
    pt: 'Leve a barra da posição indicada até acima da cabeça usando uma extensão potente de pernas e quadril. Entre sob a barra, receba com os braços estendidos e finalize estável.',
  },
  'Kettlebell Swing': {
    en: 'Hinge at the hips and swing the kettlebell between the legs, then extend the hips and knees powerfully to propel the bell upward. Keep the trunk braced and control the return.',
    es: 'Lleva la kettlebell entre las piernas con una bisagra de cadera y luego extiende caderas y rodillas con potencia para impulsarla hacia arriba. Mantén el tronco firme y controla el regreso.',
    pt: 'Leve o kettlebell entre as pernas com uma dobradiça de quadril e depois estenda quadril e joelhos com potência para impulsioná-lo para cima. Mantenha o tronco firme e controle o retorno.',
  },
  'Kipping Bar Muscle-up': {
    en: 'Hang from the bar and use a kip to generate momentum, pull the torso above the bar, then transition the chest over it and press to a supported position with straight arms.',
    es: 'Desde la suspensión, tira del cuerpo hacia arriba, realiza la transición por encima de la barra o las anillas y empuja hasta una posición de apoyo con los brazos extendidos, utilizando kip solo si la variante lo permite.',
    pt: 'A partir da suspensão, puxe o corpo para cima, faça a transição sobre a barra ou as argolas e empurre até uma posição de apoio com os braços estendidos, usando kip somente quando a variante permitir.',
  },
  'Kipping Chest-to-bar Pull-up': {
    en: 'Use an arch-to-hollow kip from the bar to generate momentum, then pull until the chest contacts the bar below the collarbone. Push away to cycle smoothly into the next repetition.',
    es: 'Desde una suspensión con los brazos extendidos, tira del cuerpo hasta alcanzar la altura requerida y vuelve de forma controlada a la extensión completa, utilizando kip solo cuando la variante lo indique.',
    pt: 'A partir de uma suspensão com os braços estendidos, puxe o corpo até atingir a altura exigida e retorne com controle à extensão completa, usando kip somente quando a variante indicar.',
  },
  'Kipping Deficit Handstand Push-up': {
    en: 'Begin inverted with the hands elevated to create a deficit, lower the head below hand level, then use a controlled kip and press to reach full elbow extension overhead.',
    es: 'Desde una posición de handstand estable, baja la cabeza de forma controlada y vuelve a empujar hasta extender completamente los codos. Respeta la variante indicada, ya sea estricta, con kip, déficit o libre.',
    pt: 'A partir de uma posição de handstand estável, desça a cabeça com controle e empurre novamente até estender completamente os cotovelos. Respeite a variante indicada: estrita, com kip, déficit ou livre.',
  },
  'Kipping Handstand Push-up': {
    en: 'From a wall-supported handstand, lower the head to the floor, bring the knees toward the chest, then extend the hips and legs while pressing to locked elbows overhead.',
    es: 'Desde una posición de handstand estable, baja la cabeza de forma controlada y vuelve a empujar hasta extender completamente los codos. Respeta la variante indicada, ya sea estricta, con kip, déficit o libre.',
    pt: 'A partir de uma posição de handstand estável, desça a cabeça com controle e empurre novamente até estender completamente os cotovelos. Respeite a variante indicada: estrita, com kip, déficit ou livre.',
  },
  'Kipping Muscle-up': {
    en: 'Hang from the rings and use a kip to generate upward momentum, pull the rings toward the torso, transition the shoulders over the rings, then press to a straight-arm support.',
    es: 'Desde la suspensión, tira del cuerpo hacia arriba, realiza la transición por encima de la barra o las anillas y empuja hasta una posición de apoyo con los brazos extendidos, utilizando kip solo si la variante lo permite.',
    pt: 'A partir da suspensão, puxe o corpo para cima, faça a transição sobre a barra ou as argolas e empurre até uma posição de apoio com os braços estendidos, usando kip somente quando a variante permitir.',
  },
  'Kipping Pull-up': {
    en: 'Hang from the bar and alternate between arch and hollow positions to create momentum. Drive the hips and pull until the chin clears the bar, then push away into the next kip.',
    es: 'Desde una suspensión con los brazos extendidos, tira del cuerpo hasta alcanzar la altura requerida y vuelve de forma controlada a la extensión completa, utilizando kip solo cuando la variante lo indique.',
    pt: 'A partir de uma suspensão com os braços estendidos, puxe o corpo até atingir a altura exigida e retorne com controle à extensão completa, usando kip somente quando a variante indicar.',
  },
  'Kipping Toes-to-bar': {
    en: 'Hang from the bar and use an arch-to-hollow kip to generate momentum. Close the hips and lift the feet until both toes contact the bar between the hands, then swing back under control.',
    es: 'Cuélgate con los brazos extendidos y utiliza el tronco y las caderas para elevar las piernas o rodillas hasta el punto de contacto indicado. Regresa con control y utiliza kip solo si corresponde a la variante.',
    pt: 'Pendure-se com os braços estendidos e use o tronco e o quadril para elevar as pernas ou joelhos até o ponto de contato indicado. Retorne com controle e use kip somente quando corresponder à variante.',
  },
  'Legless Rope Climb': {
    en: 'Climb the rope using the arms without a foot lock. Pull hand over hand while maintaining a strong trunk and controlled body position until reaching the required height.',
    es: 'Sube por la cuerda utilizando la técnica indicada para esta variante, manteniendo el tronco firme y el cuerpo bajo control. Continúa hasta alcanzar la altura o distancia prescrita.',
    pt: 'Suba pela corda usando a técnica indicada para esta variante, mantendo o tronco firme e o corpo sob controle. Continue até atingir a altura ou distância prescrita.',
  },
  'L Pull-up': {
    en: 'Hang from the bar with straight legs held horizontally in an L position. Maintain the leg position while pulling until the chin clears the bar, then lower under control.',
    es: 'Desde una suspensión con los brazos extendidos, tira del cuerpo hasta alcanzar la altura requerida y vuelve de forma controlada a la extensión completa, utilizando kip solo cuando la variante lo indique.',
    pt: 'A partir de uma suspensão com os braços estendidos, puxe o corpo até atingir a altura exigida e retorne com controle à extensão completa, usando kip somente quando a variante indicar.',
  },
  'L-sit': {
    en: 'Support the body on the hands with the elbows locked and shoulders active. Lift the straight legs until they are approximately parallel to the floor and hold the position.',
    es: 'Mantén los brazos extendidos y el tronco firme mientras elevas las piernas rectas aproximadamente hasta la horizontal. Conserva la posición o realiza la transición indicada con control.',
    pt: 'Mantenha os braços estendidos e o tronco firme enquanto eleva as pernas retas aproximadamente até a horizontal. Sustente a posição ou execute a transição indicada com controle.',
  },
  'L-sit on Rings': {
    en: 'Support the body on the rings with locked elbows, press the rings down, and lift the straight legs to approximately horizontal. Hold the L position while keeping the rings stable.',
    es: 'Mantén los brazos extendidos y el tronco firme mientras elevas las piernas rectas aproximadamente hasta la horizontal. Conserva la posición o realiza la transición indicada con control.',
    pt: 'Mantenha os braços estendidos e o tronco firme enquanto eleva as pernas retas aproximadamente até a horizontal. Sustente a posição ou execute a transição indicada com controle.',
  },
  'L-sit Rope Climb': {
    en: 'Climb the rope while keeping the legs extended forward in an L-sit position. Pull hand over hand and maintain trunk tension throughout the ascent.',
    es: 'Sube por la cuerda utilizando la técnica indicada para esta variante, manteniendo el tronco firme y el cuerpo bajo control. Continúa hasta alcanzar la altura o distancia prescrita.',
    pt: 'Suba pela corda usando a técnica indicada para esta variante, mantendo o tronco firme e o corpo sob controle. Continue até atingir a altura ou distância prescrita.',
  },
  'L-sit to Shoulder Stand': {
    en: 'Begin in an L-sit support on the rings, lean forward while controlling the rings, and raise the hips and legs until the body reaches a stable inverted shoulder-stand position.',
    es: 'Mantén los brazos extendidos y el tronco firme mientras elevas las piernas rectas aproximadamente hasta la horizontal. Conserva la posición o realiza la transición indicada con control.',
    pt: 'Mantenha os braços estendidos e o tronco firme enquanto eleva as pernas retas aproximadamente até a horizontal. Sustente a posição ou execute a transição indicada com controle.',
  },
  'Medicine-Ball Clean': {
    en: 'Lift the medicine ball from the floor by extending the hips and legs, shrug, then pull under and receive the ball at the chest in a squat. Stand fully to finish.',
    es: 'Levanta el balón medicinal desde el suelo extendiendo caderas y piernas, encoge los hombros y pasa por debajo para recibirlo frente al pecho en sentadilla. Ponte completamente de pie para finalizar.',
    pt: 'Levante a medicine ball do chão estendendo quadril e pernas, eleve os ombros e entre sob a bola para recebê-la junto ao peito em um agachamento. Fique completamente em pé para finalizar.',
  },
  'Modified Rope Climb': {
    en: 'Use a scaled rope-climb setup, such as pulling from a reclined or seated position, to move the body toward standing while maintaining tension and control through the arms and trunk.',
    es: 'Sube por la cuerda utilizando la técnica indicada para esta variante, manteniendo el tronco firme y el cuerpo bajo control. Continúa hasta alcanzar la altura o distancia prescrita.',
    pt: 'Suba pela corda usando a técnica indicada para esta variante, mantendo o tronco firme e o corpo sob controle. Continue até atingir a altura ou distância prescrita.',
  },
  'Muscle Snatch': {
    en: 'Lift the bar from the floor and extend the hips and knees powerfully, then continue pulling and press the bar overhead without re-bending the knees to receive it.',
    es: 'Lleva la barra desde la posición indicada hasta sobre la cabeza usando una extensión potente de piernas y caderas. Pasa debajo, recíbela con los brazos extendidos y finaliza estable.',
    pt: 'Leve a barra da posição indicada até acima da cabeça usando uma extensão potente de pernas e quadril. Entre sob a barra, receba com os braços estendidos e finalize estável.',
  },
  'Overhead Squat': {
    en: 'Hold the bar overhead with locked arms and active shoulders. Squat below parallel while keeping the bar balanced over the midfoot, then stand to full extension.',
    es: 'Sostén la barra sobre la cabeza con los brazos extendidos y los hombros activos. Baja por debajo del paralelo manteniendo la barra equilibrada sobre la mitad del pie y vuelve a la extensión completa.',
    pt: 'Segure a barra acima da cabeça com os braços estendidos e os ombros ativos. Agache abaixo do paralelo mantendo a barra equilibrada sobre o meio dos pés e volte à extensão completa.',
  },
  'Power Clean': {
    en: 'Lift the bar from the floor, extend the hips and knees explosively, then pull under and receive the bar on the shoulders in a partial squat. Stand to full extension.',
    es: 'Lleva la barra desde la posición indicada hasta los hombros usando una extensión potente de piernas y caderas. Pasa debajo para recibirla con control y ponte completamente de pie para finalizar.',
    pt: 'Leve a barra da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a barra para recebê-la com controle e fique completamente em pé para finalizar.',
  },
  'Power Clean and Split Jerk': {
    en: 'Power clean the bar to the shoulders, stand fully, then dip and drive before splitting the feet to receive the bar overhead. Recover the feet together under the locked-out bar.',
    es: 'Lleva la barra desde la posición indicada hasta los hombros usando una extensión potente de piernas y caderas. Pasa debajo para recibirla con control y ponte completamente de pie para finalizar.',
    pt: 'Leve a barra da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a barra para recebê-la com controle e fique completamente em pé para finalizar.',
  },
  'Power Snatch': {
    en: 'Lift the bar from the floor, extend the hips and knees explosively, then pull under and receive it overhead with locked arms in a partial squat. Stand fully to finish.',
    es: 'Lleva la barra desde la posición indicada hasta sobre la cabeza usando una extensión potente de piernas y caderas. Pasa debajo, recíbela con los brazos extendidos y finaliza estable.',
    pt: 'Leve a barra da posição indicada até acima da cabeça usando uma extensão potente de pernas e quadril. Entre sob a barra, receba com os braços estendidos e finalize estável.',
  },
  'Pull-over': {
    en: 'Hang from the bar, pull strongly while lifting the legs and hips toward the bar, rotate the body over it, and finish in a supported position above the bar.',
    es: 'Realiza Pull-over con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Pull-over com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Push Jerk': {
    en: 'Hold the bar at the shoulders, perform a vertical dip and powerful drive, then re-dip under the rising bar. Receive it overhead with locked arms and stand fully.',
    es: 'Sostén la barra sobre los hombros, realiza una flexión vertical y un impulso potente, y vuelve a flexionar para pasar debajo de la barra. Recíbela sobre la cabeza con los brazos extendidos y ponte completamente de pie.',
    pt: 'Segure a barra nos ombros, faça uma flexão vertical e uma impulsão potente e flexione novamente para entrar sob a barra. Receba-a acima da cabeça com os braços estendidos e fique completamente em pé.',
  },
  'Push Press': {
    en: 'Hold the bar at the shoulders, dip vertically through the knees and hips, then extend the legs and hips powerfully to drive the bar overhead. Finish with locked elbows.',
    es: 'Sostén la barra sobre los hombros, flexiona verticalmente rodillas y caderas y luego extiende las piernas y las caderas con potencia para impulsar la barra sobre la cabeza. Finaliza con los codos extendidos.',
    pt: 'Segure a barra nos ombros, flexione verticalmente joelhos e quadril e depois estenda pernas e quadril com potência para impulsionar a barra acima da cabeça. Finalize com os cotovelos estendidos.',
  },
  'Push-up': {
    en: 'Start in a plank with straight arms and a rigid body. Lower until the chest contacts the floor, then press back to full elbow extension without losing the body line.',
    es: 'Comienza en plancha con los brazos extendidos y el cuerpo firme. Baja hasta que el pecho toque el suelo y luego empuja hasta extender completamente los codos sin perder la línea corporal.',
    pt: 'Comece em prancha com os braços estendidos e o corpo firme. Desça até o peito tocar o chão e depois empurre até estender completamente os cotovelos sem perder o alinhamento corporal.',
  },
  'Ring Dip': {
    en: 'Support the body on the rings with straight arms, lower until the shoulders descend below the elbows, then press back to full extension while keeping the rings controlled.',
    es: 'Sostén el cuerpo con los brazos extendidos, baja de forma controlada hasta alcanzar la profundidad prescrita y empuja hasta volver a la extensión completa de los codos.',
    pt: 'Sustente o corpo com os braços estendidos, desça com controle até atingir a profundidade prescrita e empurre até voltar à extensão completa dos cotovelos.',
  },
  'Ring Push-up': {
    en: 'Hold a plank with the hands on rings, lower the chest between the rings while maintaining a rigid body, then press back to full elbow extension and stabilize the rings.',
    es: 'Mantén una plancha con las manos sobre las anillas, baja el pecho entre ellas sin perder la línea corporal y empuja hasta extender completamente los codos, estabilizando las anillas al finalizar.',
    pt: 'Mantenha a prancha com as mãos nas argolas, desça o peito entre elas sem perder o alinhamento do corpo e empurre até estender completamente os cotovelos, estabilizando as argolas ao final.',
  },
  'Ring Row': {
    en: 'Hold the rings with the body straight and heels on the floor. Pull the chest toward the rings while keeping the trunk rigid, then lower under control to straight arms.',
    es: 'Mantén el cuerpo firme y tira hacia el punto de contacto indicado utilizando espalda y brazos. Regresa de forma controlada hasta la posición inicial y repite.',
    pt: 'Mantenha o corpo firme e puxe em direção ao ponto de contato indicado usando costas e braços. Retorne com controle à posição inicial e repita.',
  },
  'Rope Climb (Basket)': {
    en: 'Climb the rope using a basket-style foot lock to secure the rope between the feet. Stand on the lock, reach higher with the hands, and repeat to the required height.',
    es: 'Sube por la cuerda utilizando la técnica indicada para esta variante, manteniendo el tronco firme y el cuerpo bajo control. Continúa hasta alcanzar la altura o distancia prescrita.',
    pt: 'Suba pela corda usando a técnica indicada para esta variante, mantendo o tronco firme e o corpo sob controle. Continue até atingir a altura ou distância prescrita.',
  },
  'Rope Climb (Wrapping)': {
    en: 'Climb the rope by pulling the knees up, wrapping the rope around the leg and securing it with the feet, then standing on the lock and reaching higher with the hands.',
    es: 'Sube por la cuerda utilizando la técnica indicada para esta variante, manteniendo el tronco firme y el cuerpo bajo control. Continúa hasta alcanzar la altura o distancia prescrita.',
    pt: 'Suba pela corda usando a técnica indicada para esta variante, mantendo o tronco firme e o corpo sob controle. Continue até atingir a altura ou distância prescrita.',
  },
  'Row': {
    en: 'Drive through the legs from the catch, open the hips, then pull the handle toward the lower chest. Recover by extending the arms, hinging forward, and sliding back to the catch.',
    es: 'Desde la posición de inicio del remo, empuja con las piernas, abre las caderas y tira del mango hacia la parte baja del pecho. Recupera extendiendo los brazos, inclinando el torso y deslizando el asiento hacia delante.',
    pt: 'A partir da posição inicial do remo, empurre com as pernas, abra o quadril e puxe a alça em direção à parte inferior do peito. Recupere estendendo os braços, inclinando o tronco e deslizando o banco para a frente.',
  },
  'Shoot-through': {
    en: 'Support the hands on parallel objects, jump or step the feet forward between the hands into a front support, then reverse the motion to move the feet back behind the hands.',
    es: 'Realiza Shoot-through con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Shoot-through com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Shoulder Press': {
    en: 'Start with the bar at the shoulders and the body braced. Press the bar overhead without using the legs, moving the head out of the bar path and finishing with locked elbows.',
    es: 'Comienza con la barra sobre los hombros y el cuerpo firme. Empuja la barra sobre la cabeza sin usar las piernas y finaliza con los codos completamente extendidos.',
    pt: 'Comece com a barra nos ombros e o corpo firme. Empurre a barra acima da cabeça sem usar as pernas e finalize com os cotovelos completamente estendidos.',
  },
  'Single-leg Squat (Pistol)': {
    en: 'Balance on one leg with the other extended forward, descend under control until the hip passes below the knee, then drive through the working foot to stand fully.',
    es: 'Mantén la carga en la posición indicada, estabiliza el tronco y baja en sentadilla con control hasta la profundidad prescrita. Empuja el suelo para volver a la extensión completa.',
    pt: 'Mantenha a carga na posição indicada, estabilize o tronco e agache com controle até a profundidade prescrita. Empurre o chão para voltar à extensão completa.',
  },
  'Single-under': {
    en: 'Jump vertically with a relaxed body while turning the rope so it passes under the feet once per jump. Keep the jumps low, wrists efficient, and rhythm consistent.',
    es: 'Salta verticalmente con el cuerpo relajado mientras haces girar la cuerda para que pase una vez por debajo de los pies en cada salto. Mantén saltos bajos, muñecas eficientes y un ritmo constante.',
    pt: 'Salte verticalmente com o corpo relaxado enquanto gira a corda para que ela passe uma vez sob os pés em cada salto. Mantenha saltos baixos, punhos eficientes e ritmo constante.',
  },
  'Skin the Cat': {
    en: 'Hang from rings or a bar, lift the legs and hips overhead, rotate the body backward through the arms into an extended shoulder position, then reverse the motion under control.',
    es: 'Comienza erguido con las asas arriba, flexiona el tronco y tira de las asas hacia abajo utilizando brazos y caderas. Regresa con control a la posición alta y repite con un ritmo constante.',
    pt: 'Comece ereto com as alças acima da cabeça, flexione o tronco e puxe as alças para baixo usando braços e quadril. Retorne com controle à posição alta e repita em ritmo constante.',
  },
  'Slam Ball': {
    en: 'Lift the ball overhead to full extension, then forcefully slam it to the floor using the arms, trunk, and hips. Squat to retrieve the ball and repeat with control.',
    es: 'Realiza Slam Ball con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Slam Ball com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Snatch': {
    en: 'Lift the bar from the floor and accelerate it with powerful hip and leg extension, then pull under and receive it overhead in a squat with locked arms. Stand fully to finish.',
    es: 'Levanta la barra desde el suelo y acelérala con una extensión potente de caderas y piernas. Pasa por debajo y recíbela sobre la cabeza en sentadilla con los brazos extendidos, luego ponte completamente de pie.',
    pt: 'Levante a barra do chão e acelere com uma extensão potente de quadril e pernas. Entre sob a barra e receba-a acima da cabeça em agachamento com os braços estendidos; depois fique completamente em pé.',
  },
  'Snatch Balance': {
    en: 'Start with the bar on the back in a wide snatch grip, dip and drive the bar upward, then quickly drop under it into an overhead squat. Stand with the bar locked out overhead.',
    es: 'Lleva la barra desde la posición indicada hasta sobre la cabeza usando una extensión potente de piernas y caderas. Pasa debajo, recíbela con los brazos extendidos y finaliza estable.',
    pt: 'Leve a barra da posição indicada até acima da cabeça usando uma extensão potente de pernas e quadril. Entre sob a barra, receba com os braços estendidos e finalize estável.',
  },
  'Sots Press': {
    en: 'Sit in the bottom of a squat with a bar supported at the shoulders or back, maintain an upright torso, and press the bar overhead to locked arms without standing up.',
    es: 'Realiza Sots Press con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Sots Press com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Split Clean': {
    en: 'Lift and accelerate the bar from the floor, then pull under and receive it on the shoulders with the feet split front-to-back. Recover the feet together and stand fully.',
    es: 'Lleva la barra desde la posición indicada hasta los hombros usando una extensión potente de piernas y caderas. Pasa debajo para recibirla con control y ponte completamente de pie para finalizar.',
    pt: 'Leve a barra da posição indicada até os ombros usando uma extensão potente de pernas e quadril. Entre sob a barra para recebê-la com controle e fique completamente em pé para finalizar.',
  },
  'Split Jerk': {
    en: 'Dip and drive the bar from the shoulders, then split the feet front-to-back while punching the bar overhead to locked arms. Recover the feet together under control.',
    es: 'Realiza Split Jerk con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Split Jerk com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Split Snatch': {
    en: 'Lift and accelerate the bar from the floor, then pull under and receive it overhead with locked arms while splitting the feet front-to-back. Recover to a stable standing position.',
    es: 'Lleva la barra desde la posición indicada hasta sobre la cabeza usando una extensión potente de piernas y caderas. Pasa debajo, recíbela con los brazos extendidos y finaliza estable.',
    pt: 'Leve a barra da posição indicada até acima da cabeça usando uma extensão potente de pernas e quadril. Entre sob a barra, receba com os braços estendidos e finalize estável.',
  },
  'Straddle Press to Handstand': {
    en: 'Begin with the hands on the floor and legs straddled, shift the shoulders over the hands, and use compression and shoulder strength to lift the hips and legs smoothly into a handstand.',
    es: 'Mantén una posición invertida estable con los hombros activos y el cuerpo firme. Ejecuta el desplazamiento o la transición indicada manteniendo el equilibrio y el control.',
    pt: 'Mantenha uma posição invertida estável com os ombros ativos e o corpo firme. Execute o deslocamento ou a transição indicada mantendo equilíbrio e controle.',
  },
  'Strict Bar Muscle-up': {
    en: 'From a dead hang, pull the body high enough to bring the chest over the bar without a kip, transition the torso above it, then press to a straight-arm support.',
    es: 'Desde la suspensión, tira del cuerpo hacia arriba, realiza la transición por encima de la barra o las anillas y empuja hasta una posición de apoyo con los brazos extendidos, utilizando kip solo si la variante lo permite.',
    pt: 'A partir da suspensão, puxe o corpo para cima, faça a transição sobre a barra ou as argolas e empurre até uma posição de apoio com os braços estendidos, usando kip somente quando a variante permitir.',
  },
  'Strict Chest-to-bar Pull-up': {
    en: 'From a dead hang, pull without kipping until the chest contacts the bar below the collarbone. Lower under control to full arm extension before the next repetition.',
    es: 'Desde una suspensión con los brazos extendidos, tira del cuerpo hasta alcanzar la altura requerida y vuelve de forma controlada a la extensión completa, utilizando kip solo cuando la variante lo indique.',
    pt: 'A partir de uma suspensão com os braços estendidos, puxe o corpo até atingir a altura exigida e retorne com controle à extensão completa, usando kip somente quando a variante indicar.',
  },
  'Strict Handstand Push-up': {
    en: 'From a wall-supported handstand, lower the head to the floor under control and press back to locked elbows using only the upper body, without a kip.',
    es: 'Desde una posición de handstand estable, baja la cabeza de forma controlada y vuelve a empujar hasta extender completamente los codos. Respeta la variante indicada, ya sea estricta, con kip, déficit o libre.',
    pt: 'A partir de uma posição de handstand estável, desça a cabeça com controle e empurre novamente até estender completamente os cotovelos. Respeite a variante indicada: estrita, com kip, déficit ou livre.',
  },
  'Strict Knees-to-elbows': {
    en: 'Hang from the bar with straight arms and no kip. Flex the trunk and hips to bring the knees up until they contact the elbows, then lower under control.',
    es: 'Cuélgate con los brazos extendidos y utiliza el tronco y las caderas para elevar las piernas o rodillas hasta el punto de contacto indicado. Regresa con control y utiliza kip solo si corresponde a la variante.',
    pt: 'Pendure-se com os braços estendidos e use o tronco e o quadril para elevar as pernas ou joelhos até o ponto de contato indicado. Retorne com controle e use kip somente quando corresponder à variante.',
  },
  'Strict Muscle-up': {
    en: 'From a dead hang on the rings, pull the rings toward the chest without kipping, transition the shoulders over the rings, then press to a straight-arm support.',
    es: 'Desde la suspensión, tira del cuerpo hacia arriba, realiza la transición por encima de la barra o las anillas y empuja hasta una posición de apoyo con los brazos extendidos, utilizando kip solo si la variante lo permite.',
    pt: 'A partir da suspensão, puxe o corpo para cima, faça a transição sobre a barra ou as argolas e empurre até uma posição de apoio com os braços estendidos, usando kip somente quando a variante permitir.',
  },
  'Strict Pull-up': {
    en: 'Start from a dead hang with straight arms. Pull the body upward without using momentum until the chin clears the bar, then lower under control to full extension.',
    es: 'Comienza en suspensión con los brazos extendidos. Eleva el cuerpo sin impulso hasta que el mentón supere la barra y desciende con control hasta volver a la extensión completa.',
    pt: 'Comece em suspensão com os braços estendidos. Puxe o corpo sem impulso até o queixo ultrapassar a barra e desça com controle até retornar à extensão completa.',
  },
  'Strict Toes-to-bar': {
    en: 'Hang from the bar without swinging and use trunk and hip flexion to lift the straight or nearly straight legs until both toes contact the bar between the hands.',
    es: 'Cuélgate con los brazos extendidos y utiliza el tronco y las caderas para elevar las piernas o rodillas hasta el punto de contacto indicado. Regresa con control y utiliza kip solo si corresponde a la variante.',
    pt: 'Pendure-se com os braços estendidos e use o tronco e o quadril para elevar as pernas ou joelhos até o ponto de contato indicado. Retorne com controle e use kip somente quando corresponder à variante.',
  },
  'Strict Toes-to-rings': {
    en: 'Hang from the rings with straight arms and no kip. Flex the trunk and hips to raise the feet until the toes contact the rings, then lower under control.',
    es: 'Cuélgate con los brazos extendidos y utiliza el tronco y las caderas para elevar las piernas o rodillas hasta el punto de contacto indicado. Regresa con control y utiliza kip solo si corresponde a la variante.',
    pt: 'Pendure-se com os braços estendidos e use o tronco e o quadril para elevar as pernas ou joelhos até o ponto de contato indicado. Retorne com controle e use kip somente quando corresponder à variante.',
  },
  'Sumo Deadlift': {
    en: 'Take a wide stance with the toes turned out and grip the bar inside the legs. Brace the trunk and extend the knees and hips to stand tall with the bar at the hips.',
    es: 'Adopta una postura amplia con las puntas de los pies hacia afuera y agarra la barra entre las piernas. Mantén el tronco firme y extiende rodillas y caderas hasta quedar completamente de pie.',
    pt: 'Adote uma base ampla com as pontas dos pés para fora e segure a barra entre as pernas. Mantenha o tronco firme e estenda joelhos e quadril até ficar completamente em pé.',
  },
  'Sumo Deadlift High Pull': {
    en: 'Use a wide sumo stance and narrow grip, deadlift the bar by extending the legs and hips, then continue the momentum by pulling the elbows high and outside until the bar reaches the upper chest.',
    es: 'Adopta una postura sumo amplia y un agarre estrecho, levanta la barra extendiendo piernas y caderas y continúa llevando los codos hacia arriba y afuera hasta que la barra llegue a la parte superior del pecho.',
    pt: 'Adote uma base sumô ampla e uma pegada estreita, levante a barra estendendo pernas e quadril e continue levando os cotovelos para cima e para fora até a barra alcançar a parte superior do peito.',
  },
  'Swing to Backward Roll to Support': {
    en: 'Swing on the rings, lift the hips and rotate backward through an inverted position, then transition the shoulders over the rings and finish in a stable straight-arm support.',
    es: 'Realiza Swing to Backward Roll to Support con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Swing to Backward Roll to Support com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Thruster': {
    en: 'Hold the bar in the front rack and descend into a front squat. Drive upward and transfer the leg and hip extension directly into pressing the bar overhead to locked arms.',
    es: 'Sostén la barra en front rack y baja a una sentadilla frontal. Sal de la sentadilla con potencia y transfiere directamente la extensión de piernas y caderas al empuje de la barra sobre la cabeza.',
    pt: 'Segure a barra no front rack e desça em um agachamento frontal. Saia do agachamento com potência e transfira diretamente a extensão de pernas e quadril para o empurrão da barra acima da cabeça.',
  },
  'Walking Lunge': {
    en: 'Step forward and lower the rear knee toward the floor while keeping the torso controlled. Drive through the front foot to stand and continue directly into the next step.',
    es: 'Da un paso hacia delante y baja la rodilla trasera hacia el suelo manteniendo el torso controlado. Empuja con el pie delantero para ponerte de pie y continúa directamente con el siguiente paso.',
    pt: 'Dê um passo à frente e desça o joelho de trás em direção ao chão mantendo o tronco controlado. Empurre com o pé da frente para ficar em pé e continue diretamente para o próximo passo.',
  },
  'Wall-ball Shot': {
    en: 'Hold the medicine ball at the chest, squat below parallel, then drive upward and throw the ball to the target. Catch it at the chest and transition smoothly into the next squat.',
    es: 'Sostén el balón medicinal frente al pecho, baja por debajo del paralelo y luego extiende el cuerpo para lanzar el balón al objetivo. Recíbelo frente al pecho y enlaza la siguiente sentadilla.',
    pt: 'Segure a medicine ball junto ao peito, agache abaixo do paralelo e depois estenda o corpo para lançar a bola no alvo. Receba-a junto ao peito e conecte o próximo agachamento.',
  },
  'Wall Walk': {
    en: 'Start lying face-down with the feet against a wall. Walk the feet up the wall while moving the hands toward it until reaching the required inverted position, then reverse under control.',
    es: 'Comienza boca abajo con los pies contra una pared. Camina con los pies por la pared mientras acercas las manos hasta alcanzar la posición invertida requerida y luego regresa de forma controlada.',
    pt: 'Comece deitado de barriga para baixo com os pés contra a parede. Caminhe com os pés pela parede enquanto aproxima as mãos até alcançar a posição invertida exigida e depois retorne com controle.',
  },
  'Windshield Wiper': {
    en: 'Hang from the bar and raise the legs toward it, then rotate the legs from side to side in a controlled arc while maintaining tension through the trunk and shoulders.',
    es: 'Realiza Windshield Wiper con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Windshield Wiper com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Zercher Squat': {
    en: 'Cradle the bar in the crooks of the elbows, brace the trunk, and squat below parallel while keeping the load close to the body. Drive through the feet to stand fully.',
    es: 'Mantén la carga en la posición indicada, estabiliza el tronco y baja en sentadilla con control hasta la profundidad prescrita. Empuja el suelo para volver a la extensión completa.',
    pt: 'Mantenha a carga na posição indicada, estabilize o tronco e agache com controle até a profundidade prescrita. Empurre o chão para voltar à extensão completa.',
  },
  'Pull-up': {
    en: 'Hang from the bar with straight arms, pull until the chin clears the bar, then return to full arm extension. The movement may be performed strict or with an allowed kip depending on the workout.',
    es: 'Cuélgate de la barra con los brazos extendidos, tira del cuerpo hasta que el mentón supere la barra y vuelve a la extensión completa. Puede realizarse estricto o con kip cuando el entrenamiento lo permita.',
    pt: 'Pendure-se na barra com os braços estendidos, puxe até o queixo ultrapassar a barra e volte à extensão completa. O movimento pode ser estrito ou com kip quando o treino permitir.',
  },
  'Run': {
    en: 'Run the prescribed distance or duration using a sustainable stride, upright posture, and relaxed arm swing appropriate to the intended workout intensity.',
    es: 'Corre la distancia o el tiempo indicado con una zancada sostenible, el torso erguido y un movimiento relajado de los brazos acorde con la intensidad del entrenamiento.',
    pt: 'Corra a distância ou durante o tempo indicado com uma passada sustentável, o tronco ereto e os braços relaxados, de acordo com a intensidade prevista do treino.',
  },
  'Shuttle Run': {
    en: 'Run between two marked points, touch or cross the required line, change direction efficiently, and repeat for the prescribed distance, repetitions, or time.',
    es: 'Corre entre dos puntos marcados, toca o cruza la línea indicada, cambia de dirección de forma eficiente y repite durante la distancia, las repeticiones o el tiempo prescrito.',
    pt: 'Corra entre dois pontos marcados, toque ou ultrapasse a linha indicada, mude de direção com eficiência e repita pela distância, pelas repetições ou pelo tempo prescrito.',
  },
  'Ski Erg': {
    en: 'Start tall with the handles overhead, hinge and pull the handles down using the trunk and arms, then return smoothly to the tall position for the next stroke.',
    es: 'Comienza erguido con las asas arriba, flexiona el tronco y tira de las asas hacia abajo utilizando brazos y caderas. Regresa con control a la posición alta y repite con un ritmo constante.',
    pt: 'Comece ereto com as alças acima da cabeça, flexione o tronco e puxe as alças para baixo usando braços e quadril. Retorne com controle à posição alta e repita em ritmo constante.',
  },
  'Bike Erg': {
    en: 'Pedal the bike at the prescribed cadence and resistance while maintaining a stable torso and smooth circular pedal stroke for the required distance, calories, or time.',
    es: 'Pedalea con una cadencia sostenible y una postura estable durante las calorías, la distancia o el tiempo prescritos. Mantén un movimiento fluido y una intensidad adecuada al entrenamiento.',
    pt: 'Pedale com uma cadência sustentável e postura estável durante as calorias, distância ou tempo prescritos. Mantenha um movimento fluido e intensidade adequada ao treino.',
  },
  'Air Bike': {
    en: 'Drive the pedals and moving handles together using the legs and arms. Maintain a controlled posture and cadence appropriate to the prescribed calories or duration.',
    es: 'Pedalea con una cadencia sostenible y una postura estable durante las calorías, la distancia o el tiempo prescritos. Mantén un movimiento fluido y una intensidad adecuada al entrenamiento.',
    pt: 'Pedale com uma cadência sustentável e postura estável durante as calorias, distância ou tempo prescritos. Mantenha um movimento fluido e intensidade adequada ao treino.',
  },
  'Alternating Lunge': {
    en: 'Step forward with one leg and lower the rear knee toward the floor while keeping the torso upright. Drive through the front foot to return to the start, then repeat on the opposite leg.',
    es: 'Da el paso o desplazamiento indicado y baja la rodilla trasera hacia el suelo manteniendo el torso estable. Empuja con la pierna delantera para volver a ponerte de pie y continúa según lo prescrito.',
    pt: 'Dê o passo ou deslocamento indicado e desça o joelho de trás em direção ao chão mantendo o tronco estável. Empurre com a perna da frente para voltar a ficar em pé e continue conforme prescrito.',
  },
  'Alternating Pistol Squat': {
    en: 'Balance on one leg with the other extended forward, descend under control until the hip passes below the knee, and stand fully. Switch legs for each repetition.',
    es: 'Mantén la carga en la posición indicada, estabiliza el tronco y baja en sentadilla con control hasta la profundidad prescrita. Empuja el suelo para volver a la extensión completa.',
    pt: 'Mantenha a carga na posição indicada, estabilize o tronco e agache com controle até a profundidade prescrita. Empurre o chão para voltar à extensão completa.',
  },
  'Goblet Squat': {
    en: 'Hold a kettlebell or dumbbell close to the chest, squat below parallel with the torso upright and knees tracking over the toes, then stand to full extension.',
    es: 'Mantén la carga en la posición indicada, estabiliza el tronco y baja en sentadilla con control hasta la profundidad prescrita. Empuja el suelo para volver a la extensión completa.',
    pt: 'Mantenha a carga na posição indicada, estabilize o tronco e agache com controle até a profundidade prescrita. Empurre o chão para voltar à extensão completa.',
  },
  'Dumbbell Clean and Jerk': {
    en: 'Clean the dumbbell or dumbbells to the shoulders, stand fully, then use the legs and hips to drive the load overhead and finish with locked arms.',
    es: 'Lleva la mancuerna o las mancuernas a los hombros con un clean, ponte de pie y utiliza piernas y caderas para impulsar la carga sobre la cabeza. Finaliza estable con los brazos completamente extendidos.',
    pt: 'Leve o halter ou os halteres aos ombros com um clean, fique em pé e use pernas e quadril para impulsionar a carga acima da cabeça. Finalize estável com os braços completamente estendidos.',
  },
  'Farmers Carry': {
    en: 'Hold heavy implements at the sides, stand tall with a braced trunk, and walk the prescribed distance or duration while keeping the loads controlled.',
    es: 'Sostén la carga en la posición indicada, mantén el tronco firme y camina la distancia o el tiempo prescrito conservando una postura estable y la carga bajo control.',
    pt: 'Segure a carga na posição indicada, mantenha o tronco firme e caminhe pela distância ou tempo prescritos, conservando uma postura estável e a carga sob controle.',
  },
  'Front Rack Carry': {
    en: 'Hold the load securely in the front-rack position, brace the trunk, and walk the prescribed distance or duration while maintaining an upright posture.',
    es: 'Sostén la carga en la posición indicada, mantén el tronco firme y camina la distancia o el tiempo prescrito conservando una postura estable y la carga bajo control.',
    pt: 'Segure a carga na posição indicada, mantenha o tronco firme e caminhe pela distância ou tempo prescritos, conservando uma postura estável e a carga sob controle.',
  },
  'Overhead Carry': {
    en: 'Lock the load overhead with active shoulders and a braced trunk, then walk the prescribed distance or duration while keeping the load stacked over the body.',
    es: 'Sostén la carga en la posición indicada, mantén el tronco firme y camina la distancia o el tiempo prescrito conservando una postura estable y la carga bajo control.',
    pt: 'Segure a carga na posição indicada, mantenha o tronco firme e caminhe pela distância ou tempo prescritos, conservando uma postura estável e a carga sob controle.',
  },
  'Plyo Plate Hop': {
    en: 'Stand facing a stable weight plate on the floor, jump with both feet onto the plate, and land under control. Reach the required hip and knee extension before stepping or jumping back down.',
    es: 'Realiza Plyo Plate Hop con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Plyo Plate Hop com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Sit-up': {
    en: 'Begin seated or lying with the feet anchored or positioned as prescribed. Lower the torso under control, then flex the trunk to return to the top position.',
    es: 'Desde la posición inicial indicada, controla el descenso del tronco y utiliza el abdomen para volver a la posición superior. Mantén el movimiento fluido y completa el rango prescrito.',
    pt: 'A partir da posição inicial indicada, controle a descida do tronco e use o abdômen para voltar à posição superior. Mantenha o movimento fluido e complete a amplitude prescrita.',
  },
  'V-up': {
    en: 'Lie flat with arms and legs extended, then simultaneously lift the torso and straight legs to meet above the hips. Lower both under control to the start position.',
    es: 'Desde la posición inicial indicada, controla el descenso del tronco y utiliza el abdomen para volver a la posición superior. Mantén el movimiento fluido y completa el rango prescrito.',
    pt: 'A partir da posição inicial indicada, controle a descida do tronco e use o abdômen para voltar à posição superior. Mantenha o movimento fluido e complete a amplitude prescrita.',
  },
  'Bear Crawl': {
    en: 'Move on hands and feet with the knees hovering close to the floor, keeping the trunk braced and hips controlled while traveling the prescribed distance or duration.',
    es: 'Realiza Bear Crawl con una posición corporal estable, controlando todo el rango de movimiento y cumpliendo el estándar técnico y las repeticiones, distancia o tiempo prescritos.',
    pt: 'Execute Bear Crawl com uma posição corporal estável, controlando toda a amplitude do movimento e cumprindo o padrão técnico e as repetições, distância ou tempo prescritos.',
  },
  'Arch Hold and Rocks': {
    en: 'Lie face down with the arms extended overhead. Lift the chest, arms, and legs while keeping the body long; hold the arch position or rock smoothly without losing tension.',
    es: 'Acuéstate boca abajo con los brazos extendidos sobre la cabeza. Eleva el pecho, los brazos y las piernas manteniendo el cuerpo largo; sostén la posición arqueada o balancéate sin perder tensión.',
    pt: 'Deite de barriga para baixo com os braços estendidos acima da cabeça. Eleve o peito, os braços e as pernas mantendo o corpo alongado; sustente a posição arqueada ou balance sem perder a tensão.',
  },
  'Arch-Hollow Tension Drill': {
    en: 'Move between controlled arch and hollow body positions while keeping the arms and legs extended and maintaining continuous trunk tension through each transition.',
    es: 'Alterna de forma controlada entre las posiciones de arco y hollow, manteniendo brazos y piernas extendidos y tensión continua en el tronco durante cada transición.',
    pt: 'Alterne de forma controlada entre as posições de arco e hollow, mantendo braços e pernas estendidos e tensão contínua no tronco durante cada transição.',
  },
  'Box Handstand Shrugs': {
    en: 'Place the feet on a box and support the body on straight arms with the hips stacked toward the shoulders. Keep the elbows locked while pressing tall through the shoulders and then relaxing the shoulder blades under control.',
    es: 'Apoya los pies sobre un cajón y el cuerpo sobre los brazos extendidos, llevando las caderas hacia los hombros. Mantén los codos bloqueados mientras empujas con los hombros y luego relajas las escápulas con control.',
    pt: 'Apoie os pés em uma caixa e o corpo sobre os braços estendidos, levando o quadril em direção aos ombros. Mantenha os cotovelos travados enquanto empurra pelos ombros e depois relaxa as escápulas com controle.',
  },
  'Box Support Hold': {
    en: 'Support the body between stable boxes with straight arms, shoulders pressed down, and the trunk braced. Keep the feet clear of the floor and hold a controlled support position.',
    es: 'Sostén el cuerpo entre cajones estables con los brazos extendidos, los hombros hacia abajo y el tronco firme. Mantén los pies separados del suelo y conserva una posición de apoyo controlada.',
    pt: 'Sustente o corpo entre caixas estáveis com os braços estendidos, os ombros pressionados para baixo e o tronco firme. Mantenha os pés fora do chão e segure uma posição de apoio controlada.',
  },
  'Hollow Hold': {
    en: 'Lie on the back, press the lower back into the floor, and lift the shoulders and legs. Extend the arms overhead and hold a long hollow position without allowing the lower back to arch.',
    es: 'Acuéstate boca arriba, presiona la zona lumbar contra el suelo y eleva los hombros y las piernas. Extiende los brazos sobre la cabeza y mantén la posición hollow sin arquear la espalda baja.',
    pt: 'Deite de costas, pressione a lombar contra o chão e eleve os ombros e as pernas. Estenda os braços acima da cabeça e mantenha a posição hollow sem arquear a região lombar.',
  },
  'Hollow Rocks': {
    en: 'Maintain a hollow body position with the lower back pressed into the floor and rock smoothly from the shoulders toward the hips without changing the body shape.',
    es: 'Mantén la posición hollow con la zona lumbar presionada contra el suelo y balancéate suavemente desde los hombros hacia las caderas sin cambiar la forma del cuerpo.',
    pt: 'Mantenha a posição hollow com a lombar pressionada contra o chão e balance suavemente dos ombros em direção ao quadril sem alterar o formato do corpo.',
  },
  'Hollow Static Pike-up Sliders': {
    en: 'Start in a hollow plank with the feet on sliders. Keep the legs straight and shoulders active while drawing the feet toward the hands to lift the hips into a pike, then return under control.',
    es: 'Comienza en plancha hollow con los pies sobre deslizadores. Mantén las piernas extendidas y los hombros activos mientras acercas los pies a las manos para elevar las caderas en pike, y vuelve con control.',
    pt: 'Comece em prancha hollow com os pés sobre deslizadores. Mantenha as pernas estendidas e os ombros ativos enquanto aproxima os pés das mãos para elevar o quadril em pike e retorne com controle.',
  },
  'Kip Swing': {
    en: 'Hang from the bar with active shoulders and alternate between hollow and arch positions. Drive the movement from the shoulders and trunk while keeping the legs together and the swing controlled.',
    es: 'Cuélgate de la barra con los hombros activos y alterna entre las posiciones hollow y arco. Genera el movimiento desde los hombros y el tronco, manteniendo las piernas juntas y el balanceo controlado.',
    pt: 'Pendure-se na barra com os ombros ativos e alterne entre as posições hollow e arco. Gere o movimento pelos ombros e pelo tronco, mantendo as pernas juntas e o balanço controlado.',
  },
  'Ring Support Tuck-ups': {
    en: 'Hold a stable straight-arm support on the rings. Keep the shoulders pressed down while drawing the knees toward the chest, then extend the legs again without losing ring control.',
    es: 'Mantén un apoyo estable sobre las anillas con los brazos extendidos. Conserva los hombros hacia abajo mientras acercas las rodillas al pecho y vuelve a extender las piernas sin perder el control de las anillas.',
    pt: 'Mantenha um apoio estável nas argolas com os braços estendidos. Preserve os ombros pressionados para baixo enquanto leva os joelhos ao peito e estenda as pernas novamente sem perder o controle das argolas.',
  },
  'Shoulder Opener': {
    en: 'Kneel with the hands supported on an elevated surface and the arms straight. Brace the trunk and gently lower the chest between the arms to open the shoulders without forcing the lower back to arch.',
    es: 'Arrodíllate con las manos apoyadas sobre una superficie elevada y los brazos extendidos. Mantén el tronco firme y baja suavemente el pecho entre los brazos para abrir los hombros sin forzar el arco lumbar.',
    pt: 'Ajoelhe-se com as mãos apoiadas em uma superfície elevada e os braços estendidos. Mantenha o tronco firme e desça suavemente o peito entre os braços para abrir os ombros sem forçar o arco lombar.',
  },
  'Superman Hold': {
    en: 'Lie face down with the arms extended overhead. Lift the chest, arms, and legs from the floor, keep the neck neutral, and hold the position with tension through the back and glutes.',
    es: 'Acuéstate boca abajo con los brazos extendidos sobre la cabeza. Eleva el pecho, los brazos y las piernas del suelo, mantén el cuello neutro y sostén la posición con tensión en la espalda y los glúteos.',
    pt: 'Deite de barriga para baixo com os braços estendidos acima da cabeça. Eleve o peito, os braços e as pernas do chão, mantenha o pescoço neutro e sustente a posição com tensão nas costas e nos glúteos.',
  },
  'Toe-assist Pull-up': {
    en: 'Stand beneath the bar with the toes lightly supported on a box. Use only the assistance needed from the legs while pulling until the chin clears the bar, then lower under control to straight arms.',
    es: 'Colócate bajo la barra con las puntas de los pies apoyadas ligeramente sobre un cajón. Usa solo la ayuda necesaria de las piernas mientras tiras hasta superar la barra con el mentón y baja con control.',
    pt: 'Posicione-se sob a barra com as pontas dos pés levemente apoiadas em uma caixa. Use apenas a ajuda necessária das pernas enquanto puxa até o queixo ultrapassar a barra e desça com controle.',
  },
};

export function getMovementTranslations(movement: MovementSeed) {
  const localized = movementTranslations[movement.name];

  if (!localized) {
    throw new Error(
      `Movement "${movement.name}" is missing en/es/pt descriptions.`,
    );
  }

  return movementSeedLocales.map((locale) => ({
    locale,
    description: localized[locale],
  }));
}

export const movements: readonly MovementSeed[] = [
  { name: 'AbMat Sit-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['AbMat Sit Up'], description: 'Sit with the soles of the feet together and an AbMat supporting the lower back. Lie back until the shoulders contact the floor, then flex the trunk to sit up and touch the feet.', videoUrl: 'https://www.crossfit.com/essentials/the-abmat-sit-up' },
  { name: 'Air Squat', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['REPS'], isFoundational: true, aliases: [], description: 'Stand with the feet about shoulder-width apart. Send the hips back and down, keep the chest upright and knees tracking over the toes, descend below parallel, then stand to full hip and knee extension.', videoUrl: 'https://www.crossfit.com/essentials/the-air-squat' },
  { name: 'Back Scale', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DURATION'], isFoundational: false, aliases: [], description: 'Balance on one leg while extending the other leg behind the body. Hinge forward with a braced trunk until the torso and raised leg form a long controlled line, then return to standing.', videoUrl: 'https://www.crossfit.com/essentials/back-scales-progression' },
  { name: 'Back Squat', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Air Squat', description: 'Support a barbell across the upper back, brace the trunk, and squat until the hip crease passes below the knees. Drive through the feet to return to full standing extension.', videoUrl: 'https://www.crossfit.com/essentials/the-back-squat' },
  { name: 'Barbell Front-rack Lunge', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS', 'DISTANCE'], isFoundational: false, aliases: ['Front Rack Lunge'], baseMovementName: 'Walking Lunge', description: 'Hold a barbell in the front-rack position. Step into a lunge, lower the rear knee toward the floor while keeping the torso upright, then drive through the front foot to stand and continue.', videoUrl: 'https://www.crossfit.com/essentials/barbell-front-rack-lunge' },
  { name: 'Bench Press', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], description: 'Lie on a bench with the feet planted and shoulder blades set. Lower the bar under control to the chest, then press it upward until the elbows are fully extended.', videoUrl: 'https://www.crossfit.com/essentials/the-bench-press' },
  { name: 'Box Jump', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Stand facing a stable box, dip through the hips and knees, then jump with both feet onto the box. Land under control and reach full hip and knee extension before stepping or jumping down.', videoUrl: 'https://www.crossfit.com/essentials/the-box-jump' },
  { name: 'Box Step-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Box Step Up'], baseMovementName: 'Box Jump', description: 'Place one foot fully on the box and drive through that leg to stand on top. Reach full extension, then step down under control and repeat as prescribed.', videoUrl: 'https://www.crossfit.com/essentials/the-box-step-up' },
  { name: 'Burpee', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'From standing, place the hands on the floor and move the feet back until the chest and thighs contact the ground. Return the feet under the body and finish by jumping with the hips and knees extended.', videoUrl: 'https://www.crossfit.com/essentials/the-burpee-2' },
  { name: 'Burpee Box Jump-over', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['BBJO'], baseMovementName: 'Burpee', description: 'Perform a burpee beside or facing a box, then jump onto or over the box and travel to the opposite side. Land with control and begin the next repetition.', videoUrl: 'https://www.crossfit.com/essentials/the-burpee-box-jump-over' },
  { name: 'Butterfly Pull-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'Pull-up', description: 'Hang from the bar and use a continuous circular kip to move the chest toward the bar. Pull until the chin clears the bar, then push away and cycle directly into the next repetition.', videoUrl: 'https://www.crossfit.com/essentials/the-butterfly-pull-up' },
  { name: 'Chest-to-wall Handstand Push-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Chest-to-wall HSPU'], baseMovementName: 'Handstand', description: 'Kick or walk into a handstand facing the wall. Lower the head under control while maintaining a tight body line, then press back to locked elbows in the inverted position.', videoUrl: 'https://www.crossfit.com/essentials/the-chest-to-wall-handstand-push-up' },
  { name: 'Clean', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], description: 'Lift the bar from the floor, accelerate it with powerful hip and leg extension, then pull under and receive it on the shoulders in a front squat. Stand to full extension to finish.', videoUrl: 'https://www.crossfit.com/essentials/the-clean-2' },
  { name: 'Clean and Jerk', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['C&J', 'Clean & Jerk'], baseMovementName: 'Clean', description: 'Clean the bar from the floor to the shoulders, stand fully, then dip and drive to send the bar overhead. Receive it with locked arms and finish with the feet together and body fully extended.', videoUrl: 'https://www.crossfit.com/essentials/the-clean-and-jerk' },
  { name: 'Clean and Push Jerk', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Clean and Jerk', description: 'Clean the bar to the shoulders, stand fully, then use a vertical dip and drive to elevate the bar. Re-dip under it and receive overhead with locked arms before standing tall.', videoUrl: 'https://www.crossfit.com/essentials/the-clean-and-push-jerk' },
  { name: 'Deadlift', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: true, aliases: ['DL'], description: 'Stand over the bar with a braced neutral spine, grip outside the legs, and drive through the floor while extending the knees and hips. Finish standing tall with the bar at the hips.', videoUrl: 'https://www.crossfit.com/essentials/the-deadlift' },
  { name: 'Dip', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Support the body on parallel bars with straight arms. Lower until the shoulders descend below the elbows, then press back to full elbow extension while keeping the body controlled.', videoUrl: 'https://www.crossfit.com/essentials/the-dip' },
  { name: 'Double-under', categoryKey: 'MONOSTRUCTURAL', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Double Under', 'DU', 'Dubs'], baseMovementName: 'Single-under', description: 'Jump vertically with a relaxed body while turning the rope quickly enough for it to pass under the feet twice during each jump. Land softly and maintain a consistent rhythm.', videoUrl: 'https://www.crossfit.com/essentials/the-double-under' },
  { name: 'Dumbbell Clean', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Clean'], baseMovementName: 'Clean', description: 'Start with the dumbbell or dumbbells below the hips, extend the legs and hips powerfully, then pull under and receive the load at the shoulders. Stand fully to complete the repetition.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-clean' },
  { name: 'Dumbbell Deadlift', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Deadlift'], baseMovementName: 'Deadlift', description: 'Start with the dumbbells beside the feet, brace the trunk, and drive through the floor while extending the knees and hips. Finish standing tall with the dumbbells at the sides.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-deadlift' },
  { name: 'Dumbbell Farmers Carry', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'DISTANCE', 'DURATION'], isFoundational: false, aliases: ['DB Farmers Carry', 'Farmers Carry'], description: 'Hold a dumbbell in each hand at the sides, stand tall with the trunk braced, and walk the prescribed distance or time while keeping the shoulders stable and the loads controlled.', videoUrl: 'https://www.crossfit.com/essentials/the-farmer-carry' },
  { name: 'Dumbbell Front-rack Lunge', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS', 'DISTANCE'], isFoundational: false, aliases: ['DB Front Rack Lunge'], baseMovementName: 'Walking Lunge', description: 'Hold the dumbbells at the shoulders, step into a lunge, and lower the rear knee toward the floor. Keep the torso upright and drive through the front foot to return to standing.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-front-rack-lunge' },
  { name: 'Dumbbell Front Squat', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Front Squat'], baseMovementName: 'Front Squat', description: 'Hold the dumbbells at the shoulders, brace the trunk, and squat below parallel while keeping the chest upright. Drive through the feet to stand to full extension.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-front-squat' },
  { name: 'Dumbbell Hang Clean', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Hang Clean'], baseMovementName: 'Clean', description: 'Start standing with the dumbbells, hinge to the hang position, then extend the hips and knees aggressively. Pull under and receive the dumbbells at the shoulders before standing tall.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-hang-clean' },
  { name: 'Dumbbell Hang Power Clean', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB HPC'], baseMovementName: 'Clean', description: 'Start with the dumbbells at the hang, extend the hips and knees powerfully, then pull under and receive the loads at the shoulders in a partial squat. Stand fully to finish.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-hang-power-clean' },
  { name: 'Dumbbell Overhead Squat', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB OHS'], baseMovementName: 'Overhead Squat', description: 'Hold a dumbbell locked out overhead, brace the trunk, and squat below parallel while keeping the load stacked over the shoulder. Stand to full extension without losing the overhead position.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-overhead-squat' },
  { name: 'Dumbbell Overhead Walking Lunge', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS', 'DISTANCE'], isFoundational: false, aliases: ['DB OH Walking Lunge'], baseMovementName: 'Walking Lunge', description: 'Lock the dumbbell or dumbbells overhead and walk forward through controlled lunges. Lower the rear knee toward the floor on each step while maintaining a stable overhead position.', videoUrl: 'https://www.crossfit.com/essentials/dumbbell-overhead-walking-lunge' },
  { name: 'Dumbbell Power Clean', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Power Clean'], baseMovementName: 'Clean', description: 'Lift the dumbbells from the floor, extend the hips and knees explosively, then pull under and receive them at the shoulders in a partial squat. Stand fully to complete the rep.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-power-clean' },
  { name: 'Dumbbell Power Snatch', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Power Snatch', 'DB Snatch'], baseMovementName: 'Snatch', description: 'Move the dumbbell from the floor to overhead in one continuous motion using powerful hip and leg extension. Receive it overhead with a locked arm in a partial squat, then stand tall.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-power-snatch' },
  { name: 'Dumbbell Push Jerk', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Push Jerk'], baseMovementName: 'Push Jerk', description: 'Hold the dumbbells at the shoulders, dip and drive through the legs, then re-dip under the rising loads. Receive them overhead with locked arms and stand to full extension.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-push-jerk' },
  { name: 'Dumbbell Push Press', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Push Press'], baseMovementName: 'Push Press', description: 'Hold the dumbbells at the shoulders, perform a shallow vertical dip, then extend the legs and hips to drive the loads overhead. Finish with the elbows locked without re-bending the knees.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-push-press' },
  { name: 'Dumbbell Squat Snatch', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Squat Snatch'], baseMovementName: 'Snatch', description: 'Move the dumbbell from the floor to overhead in one motion, pulling under it into a full squat. Stabilize the load overhead and stand to full hip and knee extension.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-snatch' },
  { name: 'Dumbbell Thruster', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Thruster'], baseMovementName: 'Thruster', description: 'Hold the dumbbells at the shoulders and descend into a front squat. Drive out of the squat and transfer the leg and hip extension directly into an overhead press to locked arms.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-thruster' },
  { name: 'Dumbbell Turkish Get-up', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB TGU', 'Turkish Get-up'], description: 'Begin lying on the floor with one dumbbell locked out above the shoulder. Move through supported sitting, kneeling, and standing positions while keeping the load overhead, then reverse the sequence under control.', videoUrl: 'https://www.crossfit.com/essentials/the-dumbbell-turkish-get-up' },
  { name: 'Forward Roll From Support', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Begin in a supported position on the rings, lean forward while maintaining control, tuck the body and rotate through a forward roll, then return to a stable support position.', videoUrl: 'https://www.crossfit.com/essentials/forward-roll-from-support' },
  { name: 'Freestanding Handstand Push-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Freestanding HSPU'], baseMovementName: 'Handstand', description: 'Balance in a freestanding handstand, lower the head toward the floor under control, then press back to locked elbows while maintaining balance without wall assistance.', videoUrl: 'https://www.crossfit.com/essentials/the-freestanding-handstand-push-up' },
  { name: 'Front Scale', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DURATION'], isFoundational: false, aliases: [], description: 'Balance on one leg while lifting the other leg straight in front of the body. Keep the torso tall, knee extended, and position controlled for the prescribed time.', videoUrl: 'https://www.crossfit.com/essentials/front-scales-progression' },
  { name: 'Front Squat', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: true, aliases: [], baseMovementName: 'Air Squat', description: 'Support the bar on the shoulders in the front rack with elbows high. Squat below parallel while keeping the torso upright, then drive through the feet to stand fully.', videoUrl: 'https://www.crossfit.com/essentials/the-front-squat' },
  { name: 'GHD Back Extension', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Set the hips on the GHD pads with the torso free to move. Flex through the spine under control, then extend the back to return to a neutral aligned position.', videoUrl: 'https://www.crossfit.com/essentials/the-ghd-back-extension' },
  { name: 'GHD Hip and Back Extension', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Set up on the GHD and lower the torso by flexing at both the hips and spine. Extend the hips and back in sequence until the body returns to a straight supported position.', videoUrl: 'https://www.crossfit.com/essentials/the-ghd-hip-and-back-extension' },
  { name: 'GHD Hip, Back, and Hip-back Extension', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Use the GHD to cycle through hip extension, back extension, and combined hip-and-back extension patterns while maintaining control through each prescribed range.', videoUrl: 'https://www.crossfit.com/essentials/the-ghd-hip-back-and-hip-back-extension' },
  { name: 'GHD Hip Extension', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Set the hips free of the GHD pads, maintain a rigid neutral spine, and hinge at the hips to lower the torso. Contract the posterior chain to return the body to a straight line.', videoUrl: 'https://www.crossfit.com/essentials/the-ghd-hip-extension' },
  { name: 'GHD Sit-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['GHD', 'GHD Sit Up'], baseMovementName: 'AbMat Sit-up', description: 'Secure the feet in the GHD, extend the hips and torso backward under control, then aggressively extend the knees and flex the trunk to return and touch the foot pads.', videoUrl: 'https://www.crossfit.com/essentials/the-ghd-sit-up' },
  { name: 'Glide Kip', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'From a bar hang, swing the legs forward and upward while keeping tension through the body, then pull the hips toward the bar and transition to a supported position above it.', videoUrl: 'https://www.crossfit.com/essentials/the-glide-kip' },
  { name: 'Good Morning', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], description: 'Support a bar on the upper back, soften the knees, brace the trunk, and hinge the hips backward while keeping the spine neutral. Squeeze the glutes and extend the hips to stand tall.', videoUrl: 'https://www.crossfit.com/essentials/the-good-morning' },
  { name: 'Handstand', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DURATION'], isFoundational: false, aliases: [], description: 'Kick or press into an inverted position with the hands on the floor. Stack the wrists, shoulders, hips, knees, and ankles while maintaining a tight body and active shoulders.', videoUrl: 'https://www.crossfit.com/essentials/the-handstand' },
  { name: 'Handstand Pirouette', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'Handstand', description: 'From a stable handstand, shift weight from one hand to the other and step the hands around to rotate the body. Maintain active shoulders and control throughout the turn.', videoUrl: 'https://www.crossfit.com/essentials/the-handstand-pirouette' },
  { name: 'Handstand Push-up Variations', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['HSPU'], baseMovementName: 'Handstand', description: 'From an inverted handstand position, lower the head toward the floor and press back to locked elbows. The exact setup may be strict, kipping, deficit, wall-supported, or freestanding.', videoUrl: 'https://www.crossfit.com/essentials/handstand-push-up-variations' },
  { name: 'Handstand Walk', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DISTANCE', 'DURATION'], isFoundational: false, aliases: ['HSW'], baseMovementName: 'Handstand', description: 'Kick into a balanced handstand and shift weight from hand to hand to move forward. Keep the shoulders active, body tight, and hands placed in controlled steps.', videoUrl: 'https://www.crossfit.com/essentials/the-handstand-walk' },
  { name: 'Hang Clean', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Clean', description: 'Start with the bar above the floor in the hang position, extend the hips and knees powerfully, then pull under and receive the bar on the shoulders in a squat. Stand fully to finish.', videoUrl: 'https://www.crossfit.com/essentials/the-hang-clean' },
  { name: 'Hang Clean and Push Jerk', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Clean and Push Jerk', description: 'Clean the bar from the hang to the shoulders, stand fully, then dip and drive into a push jerk. Receive the bar overhead with locked arms and stand to full extension.', videoUrl: 'https://www.crossfit.com/essentials/the-hang-clean-and-push-jerk' },
  { name: 'Hanging L-sit', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DURATION'], isFoundational: false, aliases: [], baseMovementName: 'L-sit', description: 'Hang from a pull-up bar with straight arms and lift the straight legs until they are approximately parallel to the floor. Maintain a tight trunk and hold the position.', videoUrl: 'https://www.crossfit.com/essentials/the-hanging-l-sit' },
  { name: 'Hang Power Clean', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['HPC'], baseMovementName: 'Clean', description: 'Start with the bar at the hang, extend the hips and knees explosively, then pull under and receive the bar on the shoulders in a partial squat. Stand fully to finish.', videoUrl: 'https://www.crossfit.com/essentials/the-hang-power-clean' },
  { name: 'Hang Power Snatch', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['HPS'], baseMovementName: 'Snatch', description: 'Start with the bar at the hang, extend the hips and knees explosively, then pull under and receive the bar overhead with locked arms in a partial squat. Stand fully to finish.', videoUrl: 'https://www.crossfit.com/essentials/the-hang-power-snatch' },
  { name: 'Hang Snatch', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Snatch', description: 'Start with the bar above the floor in the hang position, extend the hips and knees powerfully, then pull under and receive the bar overhead in a full squat. Stand to full extension.', videoUrl: 'https://www.crossfit.com/essentials/the-hang-snatch' },
  { name: 'Inverted Burpee', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'Burpee', description: 'Roll backward from standing into an inverted position, use momentum and body control to return the feet to the floor, then stand or jump to full extension to complete the repetition.', videoUrl: 'https://www.crossfit.com/essentials/the-inverted-burpee' },
  { name: 'Kettlebell Snatch', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['KB Snatch'], baseMovementName: 'Snatch', description: 'Swing the kettlebell between the legs, extend the hips powerfully, and guide the bell close to the body. Punch the hand through to finish with the kettlebell stable overhead.', videoUrl: 'https://www.crossfit.com/essentials/the-kettlebell-snatch' },
  { name: 'Kettlebell Swing', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['KBS', 'American Kettlebell Swing'], description: 'Hinge at the hips and swing the kettlebell between the legs, then extend the hips and knees powerfully to propel the bell upward. Keep the trunk braced and control the return.', videoUrl: 'https://www.crossfit.com/essentials/the-kettlebell-swing' },
  { name: 'Kipping Bar Muscle-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['BMU', 'Bar Muscle-up'], description: 'Hang from the bar and use a kip to generate momentum, pull the torso above the bar, then transition the chest over it and press to a supported position with straight arms.', videoUrl: 'https://www.crossfit.com/essentials/the-kipping-bar-muscle-up' },
  { name: 'Kipping Chest-to-bar Pull-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['C2B'], baseMovementName: 'Pull-up', description: 'Use an arch-to-hollow kip from the bar to generate momentum, then pull until the chest contacts the bar below the collarbone. Push away to cycle smoothly into the next repetition.', videoUrl: 'https://www.crossfit.com/essentials/the-kipping-chest-to-bar-pull-up' },
  { name: 'Kipping Deficit Handstand Push-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Deficit HSPU'], baseMovementName: 'Handstand', description: 'Begin inverted with the hands elevated to create a deficit, lower the head below hand level, then use a controlled kip and press to reach full elbow extension overhead.', videoUrl: 'https://www.crossfit.com/essentials/the-kipping-deficit-handstand-push-up' },
  { name: 'Kipping Handstand Push-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Kipping HSPU'], baseMovementName: 'Handstand', description: 'From a wall-supported handstand, lower the head to the floor, bring the knees toward the chest, then extend the hips and legs while pressing to locked elbows overhead.', videoUrl: 'https://www.crossfit.com/essentials/the-kipping-handstand-push-up' },
  { name: 'Kipping Muscle-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['MU', 'Ring Muscle-up'], description: 'Hang from the rings and use a kip to generate upward momentum, pull the rings toward the torso, transition the shoulders over the rings, then press to a straight-arm support.', videoUrl: 'https://www.crossfit.com/essentials/the-kipping-muscle-up' },
  { name: 'Kipping Pull-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'Pull-up', description: 'Hang from the bar and alternate between arch and hollow positions to create momentum. Drive the hips and pull until the chin clears the bar, then push away into the next kip.', videoUrl: 'https://www.crossfit.com/essentials/the-kipping-pull-up' },
  { name: 'Kipping Toes-to-bar', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['T2B', 'TTB'], description: 'Hang from the bar and use an arch-to-hollow kip to generate momentum. Close the hips and lift the feet until both toes contact the bar between the hands, then swing back under control.', videoUrl: 'https://www.crossfit.com/essentials/the-kipping-toes-to-bar' },
  { name: 'Legless Rope Climb', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS', 'DISTANCE'], isFoundational: false, aliases: [], baseMovementName: 'Rope Climb (Wrapping)', description: 'Climb the rope using the arms without a foot lock. Pull hand over hand while maintaining a strong trunk and controlled body position until reaching the required height.', videoUrl: 'https://www.crossfit.com/essentials/the-legless-rope-climb' },
  { name: 'L Pull-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['L Pull Up'], baseMovementName: 'Pull-up', description: 'Hang from the bar with straight legs held horizontally in an L position. Maintain the leg position while pulling until the chin clears the bar, then lower under control.', videoUrl: 'https://www.crossfit.com/essentials/the-l-pull-up' },
  { name: 'L-sit', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DURATION'], isFoundational: false, aliases: [], description: 'Support the body on the hands with the elbows locked and shoulders active. Lift the straight legs until they are approximately parallel to the floor and hold the position.', videoUrl: 'https://www.crossfit.com/essentials/the-l-sit' },
  { name: 'L-sit on Rings', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DURATION'], isFoundational: false, aliases: [], baseMovementName: 'L-sit', description: 'Support the body on the rings with locked elbows, press the rings down, and lift the straight legs to approximately horizontal. Hold the L position while keeping the rings stable.', videoUrl: 'https://www.crossfit.com/essentials/the-l-sit-on-rings' },
  { name: 'L-sit Rope Climb', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS', 'DISTANCE'], isFoundational: false, aliases: [], baseMovementName: 'Rope Climb (Wrapping)', description: 'Climb the rope while keeping the legs extended forward in an L-sit position. Pull hand over hand and maintain trunk tension throughout the ascent.', videoUrl: 'https://www.crossfit.com/essentials/the-l-sit-rope-climb' },
  { name: 'L-sit to Shoulder Stand', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'L-sit', description: 'Begin in an L-sit support on the rings, lean forward while controlling the rings, and raise the hips and legs until the body reaches a stable inverted shoulder-stand position.', videoUrl: 'https://www.crossfit.com/essentials/the-l-sit-to-shoulder-stand' },
  { name: 'Medicine-Ball Clean', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: true, aliases: ['Med-Ball Clean'], baseMovementName: 'Clean', description: 'Lift the medicine ball from the floor by extending the hips and legs, shrug, then pull under and receive the ball at the chest in a squat. Stand fully to finish.', videoUrl: 'https://www.crossfit.com/essentials/the-medicine-ball-clean' },
  { name: 'Modified Rope Climb', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'Rope Climb (Wrapping)', description: 'Use a scaled rope-climb setup, such as pulling from a reclined or seated position, to move the body toward standing while maintaining tension and control through the arms and trunk.', videoUrl: 'https://www.crossfit.com/essentials/the-modified-rope-climb' },
  { name: 'Muscle Snatch', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Snatch', description: 'Lift the bar from the floor and extend the hips and knees powerfully, then continue pulling and press the bar overhead without re-bending the knees to receive it.', videoUrl: 'https://www.crossfit.com/essentials/the-muscle-snatch' },
  { name: 'Overhead Squat', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: true, aliases: ['OHS'], baseMovementName: 'Air Squat', description: 'Hold the bar overhead with locked arms and active shoulders. Squat below parallel while keeping the bar balanced over the midfoot, then stand to full extension.', videoUrl: 'https://www.crossfit.com/essentials/the-overhead-squat' },
  { name: 'Power Clean', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['PC'], baseMovementName: 'Clean', description: 'Lift the bar from the floor, extend the hips and knees explosively, then pull under and receive the bar on the shoulders in a partial squat. Stand to full extension.', videoUrl: 'https://www.crossfit.com/essentials/the-power-clean' },
  { name: 'Power Clean and Split Jerk', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Clean and Jerk', description: 'Power clean the bar to the shoulders, stand fully, then dip and drive before splitting the feet to receive the bar overhead. Recover the feet together under the locked-out bar.', videoUrl: 'https://www.crossfit.com/essentials/the-power-clean-and-split-jerk' },
  { name: 'Power Snatch', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['PS'], baseMovementName: 'Snatch', description: 'Lift the bar from the floor, extend the hips and knees explosively, then pull under and receive it overhead with locked arms in a partial squat. Stand fully to finish.', videoUrl: 'https://www.crossfit.com/essentials/the-power-snatch' },
  { name: 'Pull-over', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Hang from the bar, pull strongly while lifting the legs and hips toward the bar, rotate the body over it, and finish in a supported position above the bar.', videoUrl: 'https://www.crossfit.com/essentials/the-pull-over' },
  { name: 'Push Jerk', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: true, aliases: [], description: 'Hold the bar at the shoulders, perform a vertical dip and powerful drive, then re-dip under the rising bar. Receive it overhead with locked arms and stand fully.', videoUrl: 'https://www.crossfit.com/essentials/the-push-jerk' },
  { name: 'Push Press', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: true, aliases: [], description: 'Hold the bar at the shoulders, dip vertically through the knees and hips, then extend the legs and hips powerfully to drive the bar overhead. Finish with locked elbows.', videoUrl: 'https://www.crossfit.com/essentials/the-push-press' },
  { name: 'Push-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Push Up'], description: 'Start in a plank with straight arms and a rigid body. Lower until the chest contacts the floor, then press back to full elbow extension without losing the body line.', videoUrl: 'https://www.crossfit.com/essentials/the-push-up' },
  { name: 'Ring Dip', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'Dip', description: 'Support the body on the rings with straight arms, lower until the shoulders descend below the elbows, then press back to full extension while keeping the rings controlled.', videoUrl: 'https://www.crossfit.com/essentials/the-ring-dip' },
  { name: 'Ring Push-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Ring Push-ups'], baseMovementName: 'Push-up', description: 'Hold a plank with the hands on rings, lower the chest between the rings while maintaining a rigid body, then press back to full elbow extension and stabilize the rings.', videoUrl: 'https://youtu.be/vSsjHM_8XCs' },
  { name: 'Ring Row', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Hold the rings with the body straight and heels on the floor. Pull the chest toward the rings while keeping the trunk rigid, then lower under control to straight arms.', videoUrl: 'https://www.crossfit.com/essentials/the-ring-row' },
  { name: 'Rope Climb (Basket)', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS', 'DISTANCE'], isFoundational: false, aliases: ['Basket Rope Climb'], description: 'Climb the rope using a basket-style foot lock to secure the rope between the feet. Stand on the lock, reach higher with the hands, and repeat to the required height.', videoUrl: 'https://www.crossfit.com/essentials/the-rope-climb-basket' },
  { name: 'Rope Climb (Wrapping)', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS', 'DISTANCE'], isFoundational: false, aliases: ['Rope Climb'], description: 'Climb the rope by pulling the knees up, wrapping the rope around the leg and securing it with the feet, then standing on the lock and reaching higher with the hands.', videoUrl: 'https://www.crossfit.com/essentials/the-rope-climb-wrapping' },
  { name: 'Row', categoryKey: 'MONOSTRUCTURAL', measurementTypeKeys: ['DISTANCE', 'CALORIES', 'DURATION'], isFoundational: false, aliases: ['Rowing', 'Rower'], description: 'Drive through the legs from the catch, open the hips, then pull the handle toward the lower chest. Recover by extending the arms, hinging forward, and sliding back to the catch.', videoUrl: 'https://www.crossfit.com/essentials/the-row' },
  { name: 'Shoot-through', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Support the hands on parallel objects, jump or step the feet forward between the hands into a front support, then reverse the motion to move the feet back behind the hands.', videoUrl: 'https://www.crossfit.com/essentials/the-shoot-through' },
  { name: 'Shoulder Press', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: true, aliases: ['Strict Press'], description: 'Start with the bar at the shoulders and the body braced. Press the bar overhead without using the legs, moving the head out of the bar path and finishing with locked elbows.', videoUrl: 'https://www.crossfit.com/essentials/the-shoulder-press' },
  { name: 'Single-leg Squat (Pistol)', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Pistol', 'Pistol Squat'], baseMovementName: 'Air Squat', description: 'Balance on one leg with the other extended forward, descend under control until the hip passes below the knee, then drive through the working foot to stand fully.', videoUrl: 'https://www.crossfit.com/essentials/the-single-leg-squat-pistol' },
  { name: 'Single-under', categoryKey: 'MONOSTRUCTURAL', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Single Under', 'SU'], description: 'Jump vertically with a relaxed body while turning the rope so it passes under the feet once per jump. Keep the jumps low, wrists efficient, and rhythm consistent.', videoUrl: 'https://www.crossfit.com/essentials/the-single-under' },
  { name: 'Skin the Cat', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Hang from rings or a bar, lift the legs and hips overhead, rotate the body backward through the arms into an extended shoulder position, then reverse the motion under control.', videoUrl: 'https://www.crossfit.com/essentials/the-skin-the-cat' },
  { name: 'Slam Ball', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], description: 'Lift the ball overhead to full extension, then forcefully slam it to the floor using the arms, trunk, and hips. Squat to retrieve the ball and repeat with control.', videoUrl: 'https://www.crossfit.com/essentials/the-slam-ball' },
  { name: 'Snatch', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], description: 'Lift the bar from the floor and accelerate it with powerful hip and leg extension, then pull under and receive it overhead in a squat with locked arms. Stand fully to finish.', videoUrl: 'https://www.crossfit.com/essentials/the-snatch' },
  { name: 'Snatch Balance', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Snatch', description: 'Start with the bar on the back in a wide snatch grip, dip and drive the bar upward, then quickly drop under it into an overhead squat. Stand with the bar locked out overhead.', videoUrl: 'https://www.crossfit.com/essentials/the-snatch-balance' },
  { name: 'Sots Press', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], description: 'Sit in the bottom of a squat with a bar supported at the shoulders or back, maintain an upright torso, and press the bar overhead to locked arms without standing up.', videoUrl: 'https://www.crossfit.com/essentials/the-sots-press' },
  { name: 'Split Clean', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Clean', description: 'Lift and accelerate the bar from the floor, then pull under and receive it on the shoulders with the feet split front-to-back. Recover the feet together and stand fully.', videoUrl: 'https://www.crossfit.com/essentials/the-split-clean' },
  { name: 'Split Jerk', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Push Jerk', description: 'Dip and drive the bar from the shoulders, then split the feet front-to-back while punching the bar overhead to locked arms. Recover the feet together under control.', videoUrl: 'https://www.crossfit.com/essentials/the-split-jerk' },
  { name: 'Split Snatch', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Snatch', description: 'Lift and accelerate the bar from the floor, then pull under and receive it overhead with locked arms while splitting the feet front-to-back. Recover to a stable standing position.', videoUrl: 'https://www.crossfit.com/essentials/the-split-snatch' },
  { name: 'Straddle Press to Handstand', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'Handstand', description: 'Begin with the hands on the floor and legs straddled, shift the shoulders over the hands, and use compression and shoulder strength to lift the hips and legs smoothly into a handstand.', videoUrl: 'https://www.crossfit.com/essentials/the-straddle-press-to-handstand' },
  { name: 'Strict Bar Muscle-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Strict BMU'], baseMovementName: 'Kipping Bar Muscle-up', description: 'From a dead hang, pull the body high enough to bring the chest over the bar without a kip, transition the torso above it, then press to a straight-arm support.', videoUrl: 'https://www.crossfit.com/essentials/the-strict-bar-muscle-up' },
  { name: 'Strict Chest-to-bar Pull-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Strict C2B'], baseMovementName: 'Pull-up', description: 'From a dead hang, pull without kipping until the chest contacts the bar below the collarbone. Lower under control to full arm extension before the next repetition.', videoUrl: 'https://www.crossfit.com/essentials/the-strict-chest-to-bar-pull-up' },
  { name: 'Strict Handstand Push-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Strict HSPU'], baseMovementName: 'Handstand', description: 'From a wall-supported handstand, lower the head to the floor under control and press back to locked elbows using only the upper body, without a kip.', videoUrl: 'https://www.crossfit.com/essentials/the-strict-handstand-push-up' },
  { name: 'Strict Knees-to-elbows', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['K2E'], description: 'Hang from the bar with straight arms and no kip. Flex the trunk and hips to bring the knees up until they contact the elbows, then lower under control.', videoUrl: 'https://www.crossfit.com/essentials/the-strict-knees-to-elbows' },
  { name: 'Strict Muscle-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Strict MU'], baseMovementName: 'Kipping Muscle-up', description: 'From a dead hang on the rings, pull the rings toward the chest without kipping, transition the shoulders over the rings, then press to a straight-arm support.', videoUrl: 'https://www.crossfit.com/essentials/the-strict-muscle-up' },
  { name: 'Strict Pull-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Strict Pull Up'], baseMovementName: 'Pull-up', description: 'Start from a dead hang with straight arms. Pull the body upward without using momentum until the chin clears the bar, then lower under control to full extension.', videoUrl: 'https://youtu.be/HRV5YKKaeVw?si=X1VylK4aG7G0T_x0' },
  { name: 'Strict Toes-to-bar', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Strict T2B'], baseMovementName: 'Kipping Toes-to-bar', description: 'Hang from the bar without swinging and use trunk and hip flexion to lift the straight or nearly straight legs until both toes contact the bar between the hands.', videoUrl: 'https://www.crossfit.com/essentials/the-strict-toes-to-bar' },
  { name: 'Strict Toes-to-rings', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['T2R'], baseMovementName: 'Kipping Toes-to-bar', description: 'Hang from the rings with straight arms and no kip. Flex the trunk and hips to raise the feet until the toes contact the rings, then lower under control.', videoUrl: 'https://www.crossfit.com/essentials/the-strict-toes-to-rings' },
  { name: 'Sumo Deadlift', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Deadlift', description: 'Take a wide stance with the toes turned out and grip the bar inside the legs. Brace the trunk and extend the knees and hips to stand tall with the bar at the hips.', videoUrl: 'https://www.crossfit.com/essentials/the-sumo-deadlift' },
  { name: 'Sumo Deadlift High Pull', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: true, aliases: ['SDHP'], baseMovementName: 'Deadlift', description: 'Use a wide sumo stance and narrow grip, deadlift the bar by extending the legs and hips, then continue the momentum by pulling the elbows high and outside until the bar reaches the upper chest.', videoUrl: 'https://www.crossfit.com/essentials/the-sumo-deadlift-high-pull' },
  { name: 'Swing to Backward Roll to Support', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Swing on the rings, lift the hips and rotate backward through an inverted position, then transition the shoulders over the rings and finish in a stable straight-arm support.', videoUrl: 'https://www.crossfit.com/essentials/the-swing-to-backward-roll-to-support' },
  { name: 'Thruster', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Front Squat', description: 'Hold the bar in the front rack and descend into a front squat. Drive upward and transfer the leg and hip extension directly into pressing the bar overhead to locked arms.', videoUrl: 'https://www.crossfit.com/essentials/the-thruster' },
  { name: 'Walking Lunge', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS', 'DISTANCE'], isFoundational: false, aliases: ['Lunge'], description: 'Step forward and lower the rear knee toward the floor while keeping the torso controlled. Drive through the front foot to stand and continue directly into the next step.', videoUrl: 'https://www.crossfit.com/essentials/the-walking-lunge' },
  { name: 'Wall-ball Shot', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['Wall Ball', 'Wall-ball'], baseMovementName: 'Air Squat', description: 'Hold the medicine ball at the chest, squat below parallel, then drive upward and throw the ball to the target. Catch it at the chest and transition smoothly into the next squat.', videoUrl: 'https://www.crossfit.com/essentials/the-wall-ball' },
  { name: 'Wall Walk', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'Handstand', description: 'Start lying face-down with the feet against a wall. Walk the feet up the wall while moving the hands toward it until reaching the required inverted position, then reverse under control.', videoUrl: 'https://www.crossfit.com/essentials/the-wall-walk' },
  { name: 'Windshield Wiper', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], description: 'Hang from the bar and raise the legs toward it, then rotate the legs from side to side in a controlled arc while maintaining tension through the trunk and shoulders.', videoUrl: 'https://www.crossfit.com/essentials/the-windshield-wiper' },
  { name: 'Zercher Squat', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Air Squat', description: 'Cradle the bar in the crooks of the elbows, brace the trunk, and squat below parallel while keeping the load close to the body. Drive through the feet to stand fully.', videoUrl: 'https://www.crossfit.com/essentials/the-zercher-squat' },

  // Wodlab catalog helpers / useful movements retained from the existing seed.
  { name: 'Pull-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Pull Up'], description: 'Hang from the bar with straight arms, pull until the chin clears the bar, then return to full arm extension. The movement may be performed strict or with an allowed kip depending on the workout.' },
  { name: 'Run', categoryKey: 'MONOSTRUCTURAL', measurementTypeKeys: ['DISTANCE', 'DURATION'], isFoundational: false, aliases: ['Running'], description: 'Run the prescribed distance or duration using a sustainable stride, upright posture, and relaxed arm swing appropriate to the intended workout intensity.' },
  { name: 'Shuttle Run', categoryKey: 'MONOSTRUCTURAL', measurementTypeKeys: ['DISTANCE', 'REPS', 'DURATION'], isFoundational: false, aliases: ['Shuttle'], baseMovementName: 'Run', description: 'Run between two marked points, touch or cross the required line, change direction efficiently, and repeat for the prescribed distance, repetitions, or time.' },
  { name: 'Ski Erg', categoryKey: 'MONOSTRUCTURAL', measurementTypeKeys: ['DISTANCE', 'CALORIES', 'DURATION'], isFoundational: false, aliases: ['Ski', 'SkiErg'], description: 'Start tall with the handles overhead, hinge and pull the handles down using the trunk and arms, then return smoothly to the tall position for the next stroke.' },
  { name: 'Bike Erg', categoryKey: 'MONOSTRUCTURAL', measurementTypeKeys: ['DISTANCE', 'CALORIES', 'DURATION'], isFoundational: false, aliases: ['BikeErg'], description: 'Pedal the bike at the prescribed cadence and resistance while maintaining a stable torso and smooth circular pedal stroke for the required distance, calories, or time.' },
  { name: 'Air Bike', categoryKey: 'MONOSTRUCTURAL', measurementTypeKeys: ['CALORIES', 'DURATION'], isFoundational: false, aliases: ['Assault Bike', 'Echo Bike', 'Bike'], description: 'Drive the pedals and moving handles together using the legs and arms. Maintain a controlled posture and cadence appropriate to the prescribed calories or duration.' },
  { name: 'Alternating Lunge', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS', 'DISTANCE'], isFoundational: false, aliases: ['Alt Lunge', 'Alternating Lunges', 'Lunge Alt'], baseMovementName: 'Walking Lunge', description: 'Step forward with one leg and lower the rear knee toward the floor while keeping the torso upright. Drive through the front foot to return to the start, then repeat on the opposite leg.' },
  { name: 'Alternating Pistol Squat', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Alt Pistol', 'Alt Pistols', 'Alternating Pistols', 'Alternating Pistol'], baseMovementName: 'Single-leg Squat (Pistol)', description: 'Balance on one leg with the other extended forward, descend under control until the hip passes below the knee, and stand fully. Switch legs for each repetition.' },
  { name: 'Goblet Squat', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Air Squat', description: 'Hold a kettlebell or dumbbell close to the chest, squat below parallel with the torso upright and knees tracking over the toes, then stand to full extension.' },
  { name: 'Dumbbell Clean and Jerk', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Clean and Jerk', 'DB C&J'], baseMovementName: 'Clean and Jerk', description: 'Clean the dumbbell or dumbbells to the shoulders, stand fully, then use the legs and hips to drive the load overhead and finish with locked arms.' },
  { name: 'Farmers Carry', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'DISTANCE', 'DURATION'], isFoundational: false, aliases: ['Farmer Carry', 'Farmers Walk'], description: 'Hold heavy implements at the sides, stand tall with a braced trunk, and walk the prescribed distance or duration while keeping the loads controlled.' },
  { name: 'Front Rack Carry', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'DISTANCE', 'DURATION'], isFoundational: false, aliases: [], description: 'Hold the load securely in the front-rack position, brace the trunk, and walk the prescribed distance or duration while maintaining an upright posture.' },
  { name: 'Overhead Carry', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'DISTANCE', 'DURATION'], isFoundational: false, aliases: [], description: 'Lock the load overhead with active shoulders and a braced trunk, then walk the prescribed distance or duration while keeping the load stacked over the body.' },
  { name: 'Plyo Plate Hop', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Plyo Plate Hops', 'Plate Hop', 'Plate Hops'], baseMovementName: 'Box Jump', description: 'Stand facing a stable weight plate on the floor, jump with both feet onto the plate, and land under control. Reach the required hip and knee extension before stepping or jumping back down.' },
  { name: 'Sit-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Sit Up'], description: 'Begin seated or lying with the feet anchored or positioned as prescribed. Lower the torso under control, then flex the trunk to return to the top position.' },
  { name: 'V-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['V Up'], baseMovementName: 'Sit-up', description: 'Lie flat with arms and legs extended, then simultaneously lift the torso and straight legs to meet above the hips. Lower both under control to the start position.' },
  { name: 'Bear Crawl', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DISTANCE', 'DURATION'], isFoundational: false, aliases: [], description: 'Move on hands and feet with the knees hovering close to the floor, keeping the trunk braced and hips controlled while traveling the prescribed distance or duration.' },
  { name: 'Arch Hold and Rocks', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS', 'DURATION'], isFoundational: false, aliases: ['Arch Hold', 'Arch Rocks'], description: 'Lie face down with the arms extended overhead. Lift the chest, arms, and legs while keeping the body long; hold the arch position or rock smoothly without losing tension.', videoUrl: 'https://youtu.be/jelLnjPq4ck?si=uyYyWSCB77fwowOa' },
  { name: 'Arch-Hollow Tension Drill', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Arch Hollow Tension Drill'], description: 'Move between controlled arch and hollow body positions while keeping the arms and legs extended and maintaining continuous trunk tension through each transition.', videoUrl: 'https://youtu.be/LZfVkXz1QR8' },
  { name: 'Box Handstand Shrugs', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Box Handstand Shrug'], baseMovementName: 'Handstand', description: 'Place the feet on a box and support the body on straight arms with the hips stacked toward the shoulders. Keep the elbows locked while pressing tall through the shoulders and then relaxing the shoulder blades under control.', videoUrl: 'https://youtu.be/pBrEeSGXpKU' },
  { name: 'Box Support Hold', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DURATION'], isFoundational: false, aliases: ['Box Support Holds'], description: 'Support the body between stable boxes with straight arms, shoulders pressed down, and the trunk braced. Keep the feet clear of the floor and hold a controlled support position.', videoUrl: 'https://youtube.com/shorts/Y_z15HHdfAk' },
  { name: 'Hollow Hold', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DURATION'], isFoundational: false, aliases: ['Hollow Body Hold'], description: 'Lie on the back, press the lower back into the floor, and lift the shoulders and legs. Extend the arms overhead and hold a long hollow position without allowing the lower back to arch.', videoUrl: 'https://youtu.be/qU0r6449do4' },
  { name: 'Hollow Rocks', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS', 'DURATION'], isFoundational: false, aliases: ['Hollow Rock'], baseMovementName: 'Hollow Hold', description: 'Maintain a hollow body position with the lower back pressed into the floor and rock smoothly from the shoulders toward the hips without changing the body shape.', videoUrl: 'https://youtu.be/p7j02V1fIzU?si=i3ws9X6dcJkRa7XC' },
  { name: 'Hollow Static Pike-up Sliders', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Hollow Pike-up Sliders', 'Pike-up Sliders'], description: 'Start in a hollow plank with the feet on sliders. Keep the legs straight and shoulders active while drawing the feet toward the hands to lift the hips into a pike, then return under control.', videoUrl: 'https://youtu.be/OHdf8Vdr1rI' },
  { name: 'Kip Swing', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Kipping Swing'], baseMovementName: 'Pull-up', description: 'Hang from the bar with active shoulders and alternate between hollow and arch positions. Drive the movement from the shoulders and trunk while keeping the legs together and the swing controlled.', videoUrl: 'https://youtu.be/18pVtOJ2RxI' },
  { name: 'Ring Support Tuck-ups', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Ring Support Tuck-up'], description: 'Hold a stable straight-arm support on the rings. Keep the shoulders pressed down while drawing the knees toward the chest, then extend the legs again without losing ring control.', videoUrl: 'https://youtube.com/shorts/atSSUjbhqNc' },
  { name: 'Shoulder Opener', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DURATION'], isFoundational: false, aliases: ['Shoulder Opening Drill'], description: 'Kneel with the hands supported on an elevated surface and the arms straight. Brace the trunk and gently lower the chest between the arms to open the shoulders without forcing the lower back to arch.', videoUrl: 'https://youtube.com/shorts/_wQxN_JXbXg' },
  { name: 'Superman Hold', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DURATION'], isFoundational: false, aliases: ['Superman'], description: 'Lie face down with the arms extended overhead. Lift the chest, arms, and legs from the floor, keep the neck neutral, and hold the position with tension through the back and glutes.', videoUrl: 'https://youtu.be/zD2MQNR6QeY' },
  { name: 'Toe-assist Pull-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Toe Assisted Pull-up', 'Toe-assist Pull Up'], baseMovementName: 'Strict Pull-up', description: 'Stand beneath the bar with the toes lightly supported on a box. Use only the assistance needed from the legs while pulling until the chin clears the bar, then lower under control to straight arms.', videoUrl: 'https://youtube.com/shorts/P35ieuSTllU' },
];

export async function seedMovements(prisma: PrismaClient): Promise<void> {
  console.log('  • Seeding movements...');

  for (const movement of movements) {
    const seededMovement = await prisma.movement.upsert({
      where: { name: movement.name },
      update: {
        category: { connect: { key: movement.categoryKey } },
        measurementTypes: {
          deleteMany: {},
          create: movement.measurementTypeKeys.map((key) => ({
            measurementType: { connect: { key } },
          })),
        },
        isFoundational: movement.isFoundational,
        official: true,
        scope: 'GLOBAL',
        box: { disconnect: true },
        createdByUser: { disconnect: true },
        aliases: [...movement.aliases],
        searchText: buildMovementSearchText(movement.name, movement.aliases),
        description: getMovementTranslations(movement).find(({ locale }) => locale === 'en')!.description,
        videoUrl: movement.videoUrl ?? null,
      },
      create: {
        name: movement.name,
        category: { connect: { key: movement.categoryKey } },
        measurementTypes: {
          create: movement.measurementTypeKeys.map((key) => ({
            measurementType: { connect: { key } },
          })),
        },
        isFoundational: movement.isFoundational,
        official: true,
        scope: 'GLOBAL',
        aliases: [...movement.aliases],
        searchText: buildMovementSearchText(movement.name, movement.aliases),
        description: getMovementTranslations(movement).find(({ locale }) => locale === 'en')!.description,
        videoUrl: movement.videoUrl,
      },
    });

    for (const translation of getMovementTranslations(movement)) {
      await prisma.movementTranslation.upsert({
        where: {
          movementId_locale: {
            movementId: seededMovement.id,
            locale: translation.locale,
          },
        },
        update: {
          description: translation.description,
        },
        create: {
          movementId: seededMovement.id,
          locale: translation.locale,
          description: translation.description,
        },
      });
    }
  }

  const idsByName = new Map(
    (
      await prisma.movement.findMany({
        where: { name: { in: movements.map((movement) => movement.name) } },
        select: { id: true, name: true },
      })
    ).map((movement) => [movement.name, movement.id]),
  );

  for (const movement of movements) {
    const movementId = idsByName.get(movement.name);
    if (!movementId) {
      throw new Error(
        `Movement "${movement.name}" was not found after seeding.`,
      );
    }

    const baseMovementId = movement.baseMovementName
      ? idsByName.get(movement.baseMovementName)
      : null;

    if (movement.baseMovementName && !baseMovementId) {
      throw new Error(
        `Base movement "${movement.baseMovementName}" for "${movement.name}" was not found.`,
      );
    }

    await prisma.movement.update({
      where: { id: movementId },
      data: { baseMovementId },
    });
  }

  console.log(`    ✓ ${movements.length} movements seeded`);
  console.log(
    `    ✓ ${movements.length * movementSeedLocales.length} movement translations seeded`,
  );
}
