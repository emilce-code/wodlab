import type { PrismaClient } from '../../generated/prisma/client';
import { buildMovementSearchText } from './helpers';

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

type SeedLocale = 'en' | 'es' | 'pt';

type LocalizedMovementDescription = {
  es: string;
  pt: string;
};

const foundationalMovementTranslations: Record<
  string,
  LocalizedMovementDescription
> = {
  'Air Squat': {
    es: 'Párate con los pies aproximadamente al ancho de los hombros. Lleva las caderas hacia atrás y abajo, mantén el pecho erguido y las rodillas alineadas con los dedos de los pies, desciende por debajo del paralelo y luego extiende completamente las caderas y las rodillas.',
    pt: 'Fique em pé com os pés aproximadamente na largura dos ombros. Leve o quadril para trás e para baixo, mantenha o peito erguido e os joelhos alinhados com os dedos dos pés, desça abaixo do paralelo e depois estenda completamente o quadril e os joelhos.',
  },
  Deadlift: {
    es: 'Párate sobre la barra con la columna neutra y el tronco firme, sujeta la barra por fuera de las piernas y empuja el suelo mientras extiendes las rodillas y las caderas. Finaliza de pie con la barra a la altura de las caderas.',
    pt: 'Posicione-se sobre a barra com a coluna neutra e o tronco firme, segure a barra por fora das pernas e empurre o chão enquanto estende os joelhos e o quadril. Finalize em pé com a barra na altura do quadril.',
  },
  'Front Squat': {
    es: 'Apoya la barra sobre los hombros en la posición de front rack, con los codos altos. Desciende por debajo del paralelo manteniendo el torso erguido y luego empuja el suelo para volver a la posición de pie.',
    pt: 'Apoie a barra nos ombros na posição de front rack, com os cotovelos altos. Agache abaixo do paralelo mantendo o tronco ereto e depois empurre o chão para voltar à posição em pé.',
  },
  'Medicine-Ball Clean': {
    es: 'Levanta el balón medicinal desde el suelo extendiendo las caderas y las piernas, encoge los hombros y luego pasa por debajo para recibirlo frente al pecho en una sentadilla. Ponte completamente de pie para finalizar.',
    pt: 'Levante a medicine ball do chão estendendo o quadril e as pernas, eleve os ombros e depois entre sob a bola para recebê-la junto ao peito em um agachamento. Fique completamente em pé para finalizar.',
  },
  'Overhead Squat': {
    es: 'Sostén la barra sobre la cabeza con los brazos bloqueados y los hombros activos. Desciende por debajo del paralelo manteniendo la barra equilibrada sobre la mitad del pie y luego ponte completamente de pie.',
    pt: 'Segure a barra acima da cabeça com os braços estendidos e os ombros ativos. Agache abaixo do paralelo mantendo a barra equilibrada sobre o meio dos pés e depois fique completamente em pé.',
  },
  'Push Jerk': {
    es: 'Sostén la barra sobre los hombros, realiza una flexión vertical y un impulso potente, y luego vuelve a flexionar para pasar debajo de la barra en ascenso. Recíbela sobre la cabeza con los brazos bloqueados y ponte completamente de pie.',
    pt: 'Segure a barra nos ombros, faça uma flexão vertical e uma impulsão potente e depois flexione novamente para entrar sob a barra em movimento. Receba-a acima da cabeça com os braços estendidos e fique completamente em pé.',
  },
  'Push Press': {
    es: 'Sostén la barra sobre los hombros, flexiona verticalmente las rodillas y las caderas y luego extiende las piernas y las caderas con potencia para impulsar la barra sobre la cabeza. Finaliza con los codos bloqueados.',
    pt: 'Segure a barra nos ombros, flexione verticalmente os joelhos e o quadril e depois estenda as pernas e o quadril com potência para impulsionar a barra acima da cabeça. Finalize com os cotovelos estendidos.',
  },
  'Shoulder Press': {
    es: 'Comienza con la barra sobre los hombros y el cuerpo firme. Empuja la barra sobre la cabeza sin usar las piernas, apartando la cabeza de la trayectoria de la barra y finalizando con los codos bloqueados.',
    pt: 'Comece com a barra nos ombros e o corpo firme. Empurre a barra acima da cabeça sem usar as pernas, afastando a cabeça da trajetória da barra e finalizando com os cotovelos estendidos.',
  },
  'Sumo Deadlift High Pull': {
    es: 'Adopta una postura sumo amplia y un agarre estrecho, levanta la barra extendiendo las piernas y las caderas y continúa el movimiento llevando los codos hacia arriba y afuera hasta que la barra alcance la parte superior del pecho.',
    pt: 'Adote uma base sumô ampla e uma pegada estreita, levante a barra estendendo as pernas e o quadril e continue o movimento levando os cotovelos para cima e para fora até a barra alcançar a parte superior do peito.',
  },
};

function getMovementTranslations(movement: MovementSeed) {
  const localized = foundationalMovementTranslations[movement.name];

  if (movement.isFoundational && !localized) {
    throw new Error(
      `Foundational movement "${movement.name}" is missing Spanish and Portuguese descriptions.`,
    );
  }

  const translations: { locale: SeedLocale; description: string }[] = [
    { locale: 'en', description: movement.description },
  ];

  if (localized) {
    translations.push(
      { locale: 'es', description: localized.es },
      { locale: 'pt', description: localized.pt },
    );
  }

  return translations;
}

// Canonical GLOBAL movement catalog.
// CrossFit-listed movements include Wodlab-authored execution descriptions and links
// to the corresponding official CrossFit movement demo/resource page.
// Useful Wodlab-specific movements are retained for existing workouts and history.

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
  { name: 'Ring Push-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'Push-up', description: 'Hold a plank with the hands on rings, lower the chest between the rings while maintaining a rigid body, then press back to full elbow extension and stabilize the rings.', videoUrl: 'https://www.crossfit.com/essentials/the-ring-push-up' },
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
  { name: 'Strict Pull-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: [], baseMovementName: 'Pull-up', description: 'Start from a dead hang with straight arms. Pull the body upward without using momentum until the chin clears the bar, then lower under control to full extension.', videoUrl: 'https://www.crossfit.com/essentials/the-strict-pull-up' },
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
  { name: 'Goblet Squat', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: [], baseMovementName: 'Air Squat', description: 'Hold a kettlebell or dumbbell close to the chest, squat below parallel with the torso upright and knees tracking over the toes, then stand to full extension.' },
  { name: 'Dumbbell Clean and Jerk', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'REPS'], isFoundational: false, aliases: ['DB Clean and Jerk', 'DB C&J'], baseMovementName: 'Clean and Jerk', description: 'Clean the dumbbell or dumbbells to the shoulders, stand fully, then use the legs and hips to drive the load overhead and finish with locked arms.' },
  { name: 'Farmers Carry', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'DISTANCE', 'DURATION'], isFoundational: false, aliases: ['Farmer Carry', 'Farmers Walk'], description: 'Hold heavy implements at the sides, stand tall with a braced trunk, and walk the prescribed distance or duration while keeping the loads controlled.' },
  { name: 'Front Rack Carry', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'DISTANCE', 'DURATION'], isFoundational: false, aliases: [], description: 'Hold the load securely in the front-rack position, brace the trunk, and walk the prescribed distance or duration while maintaining an upright posture.' },
  { name: 'Overhead Carry', categoryKey: 'WEIGHTLIFTING', measurementTypeKeys: ['WEIGHT', 'DISTANCE', 'DURATION'], isFoundational: false, aliases: [], description: 'Lock the load overhead with active shoulders and a braced trunk, then walk the prescribed distance or duration while keeping the load stacked over the body.' },
  { name: 'Sit-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['Sit Up'], description: 'Begin seated or lying with the feet anchored or positioned as prescribed. Lower the torso under control, then flex the trunk to return to the top position.' },
  { name: 'V-up', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['REPS'], isFoundational: false, aliases: ['V Up'], baseMovementName: 'Sit-up', description: 'Lie flat with arms and legs extended, then simultaneously lift the torso and straight legs to meet above the hips. Lower both under control to the start position.' },
  { name: 'Bear Crawl', categoryKey: 'GYMNASTICS', measurementTypeKeys: ['DISTANCE', 'DURATION'], isFoundational: false, aliases: [], description: 'Move on hands and feet with the knees hovering close to the floor, keeping the trunk braced and hips controlled while traveling the prescribed distance or duration.' },
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
        description: movement.description,
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
        description: movement.description,
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
}
