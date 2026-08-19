/**
 * Ukrainian — a translation of `en.mjs`, key for key.
 *
 * The order is the English file's, so the two can be diffed line by line. A key
 * that is missing here falls back to English rather than to nothing: half a
 * translation is still a game somebody can play.
 *
 * `re.*` entries are not phrases but the words the plugin listens for. The
 * English ones stay in force as well, so a player who types "warp" in a
 * Ukrainian game is still understood — and so is a model that translates the
 * move on the way through.
 */
export const uk = {
  /* ---------- numbers ---------- */

  // A non-breaking space, written as an escape so it survives an editor that
  // tidies whitespace: in the printed screens a price broken across two lines
  // reads as two numbers. The panel collapses it to an ordinary space — every
  // label there is one line by construction — so this costs nothing where it is
  // not needed.
  'num.thousands': ' ',
  'num.credits': '{amount} кр',

  /* ---------- what the model is told ---------- */

  'note.language': 'Відповідай користувачеві українською.',

  'prompt.text': `
SPACE TRADER — {"type":"space_trader","steps":"<екран>"}

У цьому вікні працює справжня гра Space Trader. «Я не вмію грати в ігри», «я не
можу запустити інтерактивну гру» і «я можу лише описати її» — тут усе це
неправда: ця дія малює справжню гру на справжньому збереженні й коштує один хід.
Ніколи не пропонуй пояснити гру замість того, щоб її відкрити.

"steps" вибирає екран: new (почати гру), status, market, chart, ship, news,
jobs. Порожньо означає status. Користуйся вільно — це лише погляд, і він нічого
не коштує користувачеві.

ПАНЕЛЬ. Поки гра йде, у користувача над полем вводу є власна панель: смуги
корабля, ряд ходів під номерами 1-9, зоряна карта і списки за ними. Ці кнопки
справжні, і натиснути одну не коштує ходу. Тобі не кажуть, які саме зараз у
ряду, тож ніколи не називай кнопку, не кажи «натисни 2» і не вигадуй жодної —
скажи, що робити, і дай знайти самому. Усе, що є в ряду, можна й написати
словами, тож жоден хід не є недосяжним.

ХОДИ — {"type":"space_trader_move","steps":"<хід>"}

buy 10 water · sell all ore · warp Omega · refuel · repair

Пальне і ремонт НЕ купують на ринку — це два окремі ходи вище, і скільки не
дивись у таблицю товарів, там їх немає. "refuel" наповнює бак, "repair" лагодить
корпус.

ЛИШЕ тоді, коли користувач назвав цей хід. Ти штурман, а не пілот: ніколи не
купуй, не продавай, не стрибай і не заправляйся тому, що це здалося вдалим
ходом, ніколи не роби хід, «щоб справа рушила», і ніколи не роби кілька поспіль
тому, що один випливав з іншого. Якщо вважаєш хід правильним — скажи про це й
чекай. Модель, яка грає за когось, забрала в нього гру. А коли хід таки названо —
«заправся», «купи 10 води», «летимо на Nyle» — зроби його, не перепитуючи.

Коли питають, чим торгувати або що варто везти, СПОЧАТКУ відкрий ринок. Інакше
ти не знаєш цін, а порада без них вигадує товари, яких у цій грі немає. Дія
market каже, що тут скільки коштує; chart каже, що в межах досяжності й скільки
на це піде пального.

Коли питають, що робити, відповідай з того, що тобі справді дали, і конкретно:
який товар, скільки, яка система, скільки це коштує і чим ризикує.

Кажи, що сталося, одним-двома реченнями. Екран уже перед користувачем — не
переказуй таблиці й ніколи не описуй екран, якого цього ходу не створював.

{language}`,

  /* ---------- the panel ---------- */

  'panel.title': '{commander} · {system}',
  'panel.subtitle': 'день {day} · {tech} · {economy} · {politics}',
  'panel.subtitle.situation': 'день {day} · {tech} · {economy} · {politics} · {situation}',
  'panel.subtitle.over': '{ship} втрачено біля {system} на {day}-й день',
  'panel.subtitle.setup': 'ще нікуди не літали',

  'panel.meter.hull': 'КОРПУС',
  'panel.meter.shields': 'ЩИТИ',
  'panel.meter.fuel': 'ПАЛЬНЕ',
  'panel.meter.hold': 'ТРЮМ',
  'panel.meter.day': 'ДЕНЬ',

  'panel.field.credits': 'КРЕДИТИ',
  'panel.field.debt': 'БОРГ',
  'panel.field.range': 'ДАЛЬНІСТЬ',
  'panel.field.rangeValue': '{parsecs} пк',
  'panel.field.record': 'РЕПУТАЦІЯ',
  'panel.field.ship': 'КОРАБЕЛЬ',
  'panel.field.jobs': 'КОНТРАКТИ',
  'panel.field.jobsValue': { one: '{n} узятий', few: '{n} узяті', many: '{n} узятих' },
  'panel.field.inRange': 'ДОСЯЖНО',
  'panel.field.inRangeValue': { one: '{n} система', few: '{n} системи', many: '{n} систем' },

  'panel.tag.wanted': 'У РОЗШУКУ',
  'panel.tag.debt': 'БОРГ',
  'panel.tag.stranded': 'БЕЗ ХОДУ',
  'panel.tag.breached': 'КОРПУС ПРОБИТО',
  'panel.tag.pod': 'РЯТУВАЛЬНА КАПСУЛА',
  'panel.tag.insured': 'ЗАСТРАХОВАНО',
  'panel.tag.over': 'ВТРАЧЕНО',

  'panel.group.onsale': 'ПРОДАЄТЬСЯ ТУТ',
  'panel.group.onsale.empty': 'ця планета нічим не торгує',
  'panel.group.hold': 'У ТРЮМІ',
  'panel.group.hold.empty': 'трюм порожній',
  'panel.group.ship': 'КОРАБЕЛЬ',
  'panel.group.ship.empty': 'нічого не встановлено',
  'panel.group.crew': 'НА БОРТУ',
  'panel.group.crew.empty': 'летите самі',
  'panel.group.jobs': 'КОНТРАКТИ',
  'panel.group.jobs.empty': 'нічого не взято — контракти беруть на планеті',
  'panel.group.board': 'ДОШКА ЗАМОВЛЕНЬ',
  'panel.group.board.empty': 'сьогодні цей порт нічого не пропонує',
  'panel.group.news': 'ПРО ЩО ТУТ ГОВОРЯТЬ',
  'panel.group.news.empty': 'тут ні про що не повідомляють',
  'panel.group.log': 'ЖУРНАЛ',
  'panel.group.log.empty': 'ще нічого не сталося',

  'panel.row.buy': '{price} кр · {available} на продаж · натисніть, щоб купити',
  'panel.row.buy.broke': '{price} кр · {available} на продаж · не вистачає й на одну',
  'panel.row.buy.full': '{price} кр · трюм повний',
  'panel.row.sell': '{held} на борту · тут беруть по {price} кр · натисніть, щоб продати',
  'panel.row.sell.margin': '{held} на борту · тут беруть по {price} кр, на {margin} більше, ніж заплачено · натисніть, щоб продати',
  'panel.row.sell.loss': '{held} на борту · тут беруть по {price} кр, на {margin} менше, ніж заплачено · натисніть, щоб продати',
  'panel.row.sell.noBid': '{held} на борту · тут цього ніхто не купує',
  'panel.row.hullLabel': 'корпус',
  'panel.row.hull': '{hull} з {max}',
  'panel.row.weapons': 'зброя',
  'panel.row.shields': 'щити',
  'panel.row.gadgets': 'обладнання',
  'panel.row.quarters': 'каюти',
  'panel.row.quartersValue': { one: '{n} вільна', few: '{n} вільні', many: '{n} вільних' },
  'panel.row.nothing': 'немає',
  'panel.row.crew': '{role} · пілот {pilot}, стрілець {fighter}, механік {engineer}',
  'panel.row.job': '{reward} кр · {where}',
  'panel.row.jobHere': '{reward} кр · можна здати тут, натисніть',
  'panel.row.offer': '{reward} кр · {where} · натисніть, щоб узяти',
  'panel.row.offer.problem': '{reward} кр · {problem}',
  'panel.row.log': 'день {day}',

  'panel.entry.amount.buy': '{good} — по {price} кр, вистачить на {max}',
  'panel.entry.amount.sell': '{good} — по {price} кр, на борту {max}',
  'panel.entry.amount.hint': 'число, або лишіть порожнім — тоді скільки вийде',
  'panel.entry.amount.submit': 'ЗРОБИТИ',

  /* ---------- the deck ---------- */

  'deal.label': 'Що варто зробити на {system}',
  'deal.sell.profit': '{held} на борту, і тут дають {price} — на {margin} за одиницю більше, ніж ви віддали. Натисніть, щоб продати.',
  'deal.sell.loss': '{held} на борту. Тут дають {price} — на {margin} за одиницю менше, ніж ви віддали. Натисніть, щоб продати.',
  'deal.sell.flat': '{held} на борту, і тут дають {price} — рівно те, що ви віддали. Натисніть, щоб продати.',
  'deal.buy': '{price} тут, і {most} — це все, на що вистачить кредитів і трюму. На {system} беруть по {sells}, за {fuel} пального — {margin} за одиницю. Натисніть, щоб купити.',
  'deal.buy.broke': '{price} тут. На {system} беруть по {sells}, це було б {margin} за одиницю — але не вистачає й на одну.',
  'deal.buy.blind': '{price} тут — {compare}, {carry}. Куди везти — поки невідомо. Натисніть, щоб купити.',
  'deal.buy.blind.broke': '{price} тут — {compare}, {carry} — але не вистачає й на одну.',
  'deal.compare.cheap': 'на {margin} дешевше за звичну ціну для такої планети',
  'deal.compare.usual': 'приблизно звична тутешня ціна',
  'deal.carry.up': 'і воно тим дорожче, чим вищий техрівень',
  'deal.carry.down': 'і воно тим дорожче, чим нижчий техрівень',
  'deal.carry.flat': 'і коштує скрізь приблизно однаково',
  'deal.table.label': 'УСЯ ТАБЛИЦЯ',
  'deal.table.note': 'Усі товари, якими торгує ця планета, в обидва боки, і що з них у трюмі.',

  /* ---------- the chart ---------- */

  'board.here': 'ви тут',
  'board.reachable': '{fuel} пального · {distance} пк · {economy}, техрівень {tech}',
  'board.reachableUnknown': '{fuel} пального · {distance} пк · ніколи не відвідано',
  'board.wormhole': 'кротовина · збір {tax} кр',
  'board.seen': '{distance} пк · поза досяжністю',

  /* ---------- the row of moves ---------- */

  'move.market.label': 'РИНОК',
  'move.market.hint': 'що тут варто купити чи продати — колодою',
  'move.chart.label': 'КАРТА',
  'move.chart.hint': 'куди дістане бак',
  'move.ship.label': 'КОРАБЕЛЬ',
  'move.ship.hint': 'корпус, обладнання і хто на борту',
  'move.jobs.label': 'КОНТРАКТИ',
  'move.jobs.hint': 'узяті замовлення і дошка',
  'move.news.label': 'НОВИНИ',
  'move.news.hint': 'про що тут повідомляють',
  'move.refuel.label': 'ЗАПРАВИТИ',
  'move.refuel.hint': '{parsecs} парсеків по {price} кр — {cost} кр за повний бак',
  'move.refuel.submit': 'заправитися',
  'move.repair.label': 'РЕМОНТ',
  'move.repair.hint': '{units} корпусу по {price} кр — {cost} кр за повний ремонт',
  'move.repair.submit': 'ремонт',
  'move.warp.submit': 'лети {system}',
  'move.fight.submit': 'як минув бій',
  'move.buy.submit': 'купити {amount} {good}',
  'move.sell.submit': 'продати {amount} {good}',
  'move.restart.label': 'НОВА ГРА',
  'move.restart.hint': 'натисніть двічі — цей командир ще літає',
  'move.restart.hintArmed': 'ще раз — і {commander} лишається позаду',
  'move.restart.hintOver': 'почати спочатку, з новим командиром',
  'move.quit.label': 'ЗАКРИТИ',
  'move.quit.hint': 'прибрати гру — збереження лишається',
  'move.quit.hintOver': 'прибрати гру',

  /* ---------- the fight ---------- */

  'fight.intercepted': '{who} на {ship} тримає вас на прицілі.',
  'fight.title': '{who} · {ship}',
  'fight.subtitle': 'раунд {round} · дистанція {distance}',
  'fight.nextShip': 'Наступний заходить на вас.',
  'fight.nothingHappened': 'З цього нічого не вийшло.',
  'fight.alreadySettled': 'З цим уже все.',
  'fight.targetSwitched': 'Гармати на {ship}.',
  'fight.plundered': { one: 'Знято {n} відсік вантажу.', few: 'Знято {n} відсіки вантажу.', many: 'Знято {n} відсіків вантажу.' },
  'fight.plunderedNothing': 'Їхній трюм порожній.',

  'fight.meter.hull': 'КОРПУС',
  'fight.meter.shields': 'ЩИТИ',
  'fight.meter.theirHull': '{ship}',
  'fight.meter.theirShields': 'ЇХНІ ЩИТИ',
  'fight.meter.range': 'ДИСТАНЦІЯ',

  'fight.field.actions': 'ДІЇ',
  'fight.field.actionsValue': '{left} з {of}',
  'fight.field.yourOdds': 'ВАШ ПОСТРІЛ',
  'fight.field.theirOdds': 'ЇХНІЙ',
  'fight.field.percent': '{n}%',
  'fight.field.theirGuns': 'ЇХНЯ ЗБРОЯ',
  'fight.field.fleet': 'ЛАНКА',
  'fight.field.fleetValue': '{left} з {of} у строю',
  'fight.field.met': 'ЗУСТРІЧ',
  'fight.field.metValue': '{at} з {of}',
  'fight.field.credits': 'КРЕДИТИ',

  'fight.tag.tractor': 'ТЯГЛОВИЙ ПРОМІНЬ',
  'fight.tag.crippled': 'ВОНИ ЛЕДЬ ТРИМАЮТЬСЯ',
  'fight.tag.breached': 'КОРПУС ПРОБИТО',
  'fight.tag.downed': { one: 'ЗБИТО {n}', few: 'ЗБИТО {n}', many: 'ЗБИТО {n}' },
  'fight.tag.provoked': 'ВИ ВИСТРІЛИЛИ ПЕРШИМИ',
  'fight.tag.oppDestroyed': 'ЗНИЩЕНО',
  'fight.tag.oppSurrendered': 'ВОНИ ЗДАЛИСЯ',
  'fight.tag.playerFled': 'ВІДІРВАЛИСЯ',
  'fight.tag.playerDestroyed': 'ВТРАЧЕНО',
  'fight.tag.ignored': 'ПРОЙШЛИ МИМО',
  'fight.tag.inspected': 'ОГЛЯД ПРОЙДЕНО',
  'fight.tag.bribed': 'ВІДКУПИЛИСЯ',
  'fight.tag.playerSurrendered': 'ЗДАЛИСЯ',
  'fight.tag.playerArrested': 'ПІД ВАРТОЮ',

  'fight.over.oppDestroyed': 'від {ship} лишилися уламки',
  'fight.over.oppSurrendered': '{ship} спустив прапор',
  'fight.over.playerFled': 'ви відірвалися',
  'fight.over.playerDestroyed': 'корабель цього не пережив',
  'fight.over.ignored': 'ви пройшли мимо',
  'fight.over.inspected': 'огляд закінчено',
  'fight.over.bribed': 'вони взяли гроші й відвернулися',
  'fight.over.playerSurrendered': 'ви віддали те, по що вони прийшли',
  'fight.over.playerArrested': 'вас узяли під варту',

  'fight.group.log': 'ЩО СТАЛОСЯ',
  'fight.group.log.empty': 'поки нічого',
  'fight.group.theirHold': 'ЇХНІЙ ТРЮМ',
  'fight.group.theirHold.empty': 'вони нічого не везуть',
  'fight.group.fleet': 'РЕШТА ЛАНКИ',
  'fight.group.fleet.empty': 'цей сам',
  'fight.row.round': 'раунд {n}',
  'fight.row.theirCargo': { one: '{n} відсік', few: '{n} відсіки', many: '{n} відсіків' },
  'fight.row.reserve': 'корпус {hull}/{max} · дистанція {distance} · натисніть, щоб узяти на приціл',

  'fight.move.attack.label': 'ВОГОНЬ',
  'fight.move.attack.hint': '{chance}% влучити з цієї дистанції',
  'fight.move.attack.unarmed': 'на борту немає нічого, чим стріляти',
  'fight.move.flee.label': 'ТІКАТИ',
  'fight.move.flee.hint': '{chance}% відірватися, і вони встигнуть вистрілити',
  'fight.move.flee.locked': 'вас тримає тягловий промінь — спершу зірватися',
  'fight.move.ignore.label': 'ПРОЙТИ МИМО',
  'fight.move.ignore.hint': 'вони займаються своїми справами',
  'fight.move.closeIn.label': 'ЗБЛИЗИТИСЯ',
  'fight.move.closeIn.hint': 'ближче — точніше, і їм теж',
  'fight.move.openRange.label': 'ВІДІЙТИ',
  'fight.move.openRange.hint': 'їм важче влучити, і вам теж',
  'fight.move.submit.label': 'ДОПУСТИТИ ОГЛЯД',
  'fight.move.submit.hint': 'хай перевірять трюм',
  'fight.move.bribe.label': 'ХАБАР',
  'fight.move.bribe.hint': '{amount}, щоб подивилися в інший бік',
  'fight.move.surrender.label': 'ЗДАТИСЯ',
  'fight.move.surrender.pirate': 'заберуть вантаж і відпустять',
  'fight.move.surrender.police': 'штраф і запис у справі',
  'fight.move.surrender.bountyHunter': 'камера і дні, які вона забере',
  'fight.move.endTurn.label': 'НЕ СТРІЛЯТИ',
  'fight.move.endTurn.hint': 'віддати решту раунду',
  'fight.move.plunder.label': 'НА АБОРДАЖ',
  'fight.move.plunder.hint': 'узяти стільки, скільки візьме трюм',
  'fight.move.next.label': 'ДАЛІ',
  'fight.move.next.hint': { one: 'там ще {n}', few: 'там ще {n}', many: 'там ще {n}' },
  'fight.move.done.label': 'ЛЕТИМО ДАЛІ',
  'fight.move.done.hint': 'завершити стрибок',
  'fight.move.auto.label': 'ХАЙ ІДЕ САМО',
  'fight.move.auto.fight': 'битися до кінця, як каже налаштування',
  'fight.move.auto.avoid': 'тікати й здаватися поліції, як каже налаштування',

  'fight.context.head': 'SPACE TRADER — триває бій. {who}, корабель {ship}.',
  'fight.context.ships': 'Ваш корпус {hull}/{maxHull}. Їхній {theirHull}/{theirMax}. Дистанція {distance}.',
  'fight.context.moves': 'Ходи в користувача на власній панелі: вогонь, тікати, зблизитися, відійти, здатися й решта.',
  'fight.context.rule': 'Бій — його справа. НЕ описуй раундів, не кажи, хто переміг, не вигадуй ушкоджень і не викликай дій гри, поки він сам не назве хід. Відповідай про позицію коротко й кажи, що зробив би ти.',
  'fight.context.said': 'Досі: {text}',
  'fight.context.nothing': 'поки нічого',

  'note.fightStarted': 'Почався бій, і він на власній панелі користувача — ходи натискає він. Скажи одним реченням, хто його перехопив. НЕ описуй бою, не вирішуй, чим він скінчиться, і не роби ходів за нього.',
  'note.fightOn': 'На панелі користувача триває бій. НЕ описуй раундів і не вирішуй результату — це робить рушій, коли він натискає. Відповідай про позицію і радь, якщо питають.',
  'refuse.notAFightMove': '«{what}» — не хід у бою; є: вогонь, тікати, зблизитися, відійти, допустити огляд, хабар, здатися, на абордаж, хай іде само',

  /* ---------- starting a run ---------- */

  'setup.title': 'Новий командир',
  'setup.subtitle.background': 'чим займався до цього',
  'setup.subtitle.name': 'і як його звати',
  'setup.cards.label': 'Куди пішли очки навичок',
  'setup.skills': 'пілот {pilot} · стрілець {fighter} · торговець {trader} · механік {engineer} · електрик {electrician}',
  'setup.card.pilot.label': 'Пілот',
  'setup.card.pilot.note': 'Возив чужий вантаж, поки не купив Блоху. Тікає від того, що не переможе, і витискає з бака зайвий парсек.',
  'setup.card.fighter.label': 'Стрілець',
  'setup.card.fighter.note': 'Пішов із флоту, який не ставив зайвих питань. Влучає туди, куди цілиться, і пірати про це шкодують.',
  'setup.card.trader.label': 'Торговець',
  'setup.card.trader.note': 'Роками продавав чужий вантаж. Скрізь бере дешевше за прейскурант, а за сотню стрибків це складається у статок.',
  'setup.card.engineer.label': 'Механік',
  'setup.card.engineer.note': 'Тримав у польоті чужі кораблі. Дешево лагодить корпус і видушує більше з усього, що на ньому стоїть.',
  'setup.card.random.label': 'Будь-хто',
  'setup.card.random.note': 'Очки лягають як лягли. Хтось же має водити кораблі, яких ніхто не обрав.',
  'setup.field.background': 'ФАХ',
  'setup.entry.label': 'Командир',
  'setup.entry.hint': 'ім’я в ліцензії — {background}',
  'setup.entry.placeholder': 'Джеймсон',
  'setup.entry.submit': 'ЗЛІТ',
  'setup.name.button': 'ІМ’Я КОМАНДИРА',
  'setup.name.buttonHint': 'поле для імені, якщо його закрили',
  'setup.name.nameless': 'Джеймсон',
  'setup.begun': '{commander} виводить Блоху з {system}, у кишені {credits}.',
  'setup.chosen': '{background}. Тепер ім’я.',
  'setup.needBackground': 'Спершу оберіть фах.',
  'setup.needName': 'Командирові потрібне ім’я.',
  'setup.backgroundTaken': 'На це питання вже відповіли.',
  'setup.intro.words': 'зліт',

  /* ---------- lines for the status bar ---------- */

  'ui.notStarted': 'Гра не запущена.',
  'ui.newRun': 'Новий командир.',
  'ui.pickBackground': 'Оберіть фах на картках.',
  'ui.closed': 'Space Trader прибрано — {commander}, день {day}.',
  'ui.alreadyClosed': 'Гру вже прибрано.',
  'ui.notRunning': 'Немає чого закривати.',
  'ui.noSavedRun': 'Збереженої гри немає.',
  'ui.resumed': 'Знову на борту.',
  'ui.running': 'Гра вже йде.',
  'ui.restartConfirm': 'Натисніть ще раз, щоб лишити {commander} і почати спочатку.',
  'ui.quitIsYours': 'Закрити гру — це кнопка ЗАКРИТИ, і натискати її не мені.',
  'ui.restartIsYours': 'Почати спочатку — це кнопка НОВА ГРА, і натискати її не мені.',
  'ui.moveGone': 'Цього ходу вже немає в ряду.',
  'ui.rowGone': 'Цього вже немає в трюмі.',
  'ui.noRouteThere': 'Бак туди вже не дістане.',
  'ui.notForSale': 'Ця планета цього не продає.',
  'ui.notBought': 'Тут цього ніхто не купує.',
  'ui.nothingToSell': 'Такого на борту немає.',
  'ui.cannotAfford': 'Не вистачає й на одну.',
  'ui.holdFull': 'У трюмі немає місця.',
  'ui.dead': 'Корабель цього не пережив.',
  'ui.noGame': 'Збереженої гри немає. Почніть нову — вона стартує у випадковій системі з 1000 кредитів.',

  /* ---------- notes to the model ---------- */

  'note.noGame': 'Збереженої гри немає. Скажи про це користувачеві й запропонуй почати — але не починай сам.',
  'note.newRun': 'Створюється нова гра. На екрані користувача п’ять карток — пілот, стрілець, торговець, механік або будь-хто. Скажи, щоб обрав одну. Не обирай за нього й не переказуй карток.',
  'note.pickBackground': 'Картки все ще на екрані. Скажи лише, що треба натиснути фах.',
  'note.pickBackgroundContext': 'SPACE TRADER: створюється нова гра. Користувач обирає фах на п’яти картках на власному екрані. Нічого не кажи про світ гри, доки він цього не зробив; фах не можна обрати текстом.',
  'note.nameContext': 'SPACE TRADER: користувач обрав «{background}» і вписує ім’я командира у власне поле гри. Не відповідай замість нього й не вигадуй імені — поле створює командира тієї миті, коли його надішлють.',
  'note.opening': 'Почалася нова гра. Представ її двома-трьома реченнями, з цих фактів і лише з них:\n{brief}\nПотім запропонуй відкрити ринок або карту. Не вигадуй вантажу, цін, систем чи подій.',
  'note.opening.pressed': '\nКористувач уже зробив перший хід, і це: {text}. Представ гру, а тоді розкажи про це.',
  'note.moveMade': 'Хід зроблено, і позиція нижче — уже після нього: {text}. Скажи, що сталося, одним-двома реченнями. Другого ходу не роби.',
  'note.turnResult': '{text}',
  'note.screen': '[SPACE TRADER] На екрані користувача — {screen}.',
  'note.refused': '[SPACE TRADER] Цей хід відхилено: {reason}. Скажи це користувачеві й не повторюй його.',
  'note.closed': 'SPACE TRADER: гру прибрано. Немає ані корабля, ані вантажу, ані ринку. Не продовжуй гру з розмови вище, не вигадуй цін чи стрибків і не викликай дій гри. Якщо користувач захоче літати далі — скажи, щоб написав «повернутися до гри»: це відкриє збережений політ.',
  'note.cannotClose': 'Закривати гру — не твоя справа. У користувача є кнопка ЗАКРИТИ у власному ряду ходів — скажи, що вона там. Не кажи, що гру закрито.',
  'note.cannotRestart': 'Кидати політ — не твоя справа. У користувача є кнопка НОВА ГРА у власному ряду ходів — скажи, що вона там. Не кажи, що почалася нова гра.',
  'note.noGameToClose': 'Закривати не було чого. Скажи про це.',
  'note.alreadyClosed': 'Гру вже закрито. Скажи про це й додай, що «повернутися до гри» відкриє її знову.',
  'note.noSavedRun': 'Немає збереженої гри, до якої можна повернутися. Запропонуй почати нову — але не починай сам.',
  'note.resume': 'Збережену гру відкрито знову. Коротко введи користувача в курс з позиції нижче — де він, що в трюмі, куди дістане бак — і спитай, що робити далі. Ходів не роби.',
  'note.dead': 'SPACE TRADER: командир загинув, гру закінчено. Скажи це прямо. У користувача у власному ряду є кнопка НОВА ГРА.',

  /* ---------- the text screens ---------- */

  'screen.status.head': '{commander} — день {day}',
  'screen.status.docked': 'на орбіті {system}   техрівень {tech}   {economy}   {politics}',
  'screen.status.situation': 'ситуація тут: {situation}',
  'screen.status.fuel': 'пальне',
  'screen.status.hold': 'трюм',
  'screen.status.credits': 'кредити',
  'screen.status.debt': 'борг {amount}',
  'screen.status.hull': 'корп',
  'screen.status.bays': '{used}/{total} відсіків',
  'screen.status.parsecs': '{fuel}/{max} парсеків',
  'screen.status.cargo': 'у трюмі:',
  'screen.status.cargoLine': 'тут беруть по {price} (заплачено {paid})',

  'screen.market.head': 'РИНОК — {system}',
  'screen.market.commodity': 'ТОВАР',
  'screen.market.avail': 'НАЯВН',
  'screen.market.buy': 'КУП',
  'screen.market.sell': 'ПРОД',
  'screen.market.held': 'ТРЮМ',
  'screen.market.foot': 'трюм {used}/{total}   {credits}',
  'screen.market.prices': 'Ціни на {system} (техрівень {tech}, {economy}):',
  'screen.market.notSold': 'тут не продають',
  'screen.market.notBought': 'тут не купують',
  'screen.market.forSale': 'купити {price} (в наявності {available})',
  'screen.market.sellsFor': 'продати за {price}',
  'screen.market.inHold': '{held} у трюмі',

  'screen.chart.head': 'КАРТА — від {system}, дальність {parsecs} парсеків',
  'screen.chart.inRange': 'У МЕЖАХ ДОСЯЖНОСТІ',
  'screen.chart.nothing': '  нічого в межах досяжності — спершу заправтеся',
  'screen.chart.legend': '@ ви   O відвідано, досяжно   o досяжно   . бачено',
  'screen.chart.unvisited': 'ніколи не відвідано',
  'screen.chart.fuel': '{fuel} пального',
  'screen.chart.warp': 'Летіти до {system}',

  'screen.ship.head': 'КОРАБЕЛЬ — {ship}',
  'screen.ship.weapons': 'зброя  ',
  'screen.ship.shields': 'щити   ',
  'screen.ship.gadgets': 'обладн.',
  'screen.ship.crew': 'екіпаж ',
  'screen.ship.crewValue': '{aboard} на борту, вільних кают {free}',
  'screen.ship.none': 'немає',

  'screen.news.head': '{system} — день {day}',
  'screen.news.nothing': 'Тут ні про що не повідомляють.',

  'screen.jobs.head': 'КОНТРАКТИ',
  'screen.jobs.nothing': 'Нічого не взято. Дошка замовлень — на планеті.',
  'screen.jobs.line': '• {text}   ({reward} кр)',

  'screen.sellAll': 'Продати все: {good}',
  'screen.sellAllNote': '{held} × {price} кр',
  'screen.arrived': 'Прибуття: {system}. Пальне {fuel}, корпус {hull}.',
  'screen.arrivedMet': 'Прибуття: {system}, у дорозі зустрічей: {met}. Пальне {fuel}, корпус {hull}.',
  'screen.met': '— {who}:',
  'screen.newGame': 'Нова гра.',

  /* ---------- refusals ---------- */

  'refuse.notCommodity': '«{what}» — не товар у цій грі',
  'refuse.noSystem': 'на карті немає системи з назвою «{what}»',
  'refuse.nothingTo': 'тут нема чого на це витрачати ({move})',
  'refuse.unknownMove': '«{what}» — це не хід; ходи такі: buy, sell, warp, refuel, repair',
  'refuse.marketRefused': 'ринок цього не прийняв',
  'refuse.jumpRefused': 'такий стрибок неможливий',
  'refuse.noFuelSold': 'пального не продали',
  'refuse.noRepairs': 'ремонту не зробили',
  'refuse.saleRefused': 'цей продаж відхилено',

  /* ---------- the briefing the model gets every turn ---------- */

  'brief.head': 'SPACE TRADER — гра триває.',
  'brief.commander': 'Командир {commander}, день {day}, {credits} кр',
  'brief.commanderDebt': 'Командир {commander}, день {day}, {credits} кр, борг {debt} кр',
  'brief.docked': 'На орбіті {system} (техрівень {tech}, {economy}, {politics})',
  'brief.ship': 'Корабель {ship}: корпус {hull}/{maxHull}, пальне {fuel}/{maxFuel} парсеків, трюм {used}/{total}',
  'brief.carrying': 'Везе: {cargo}',
  'brief.empty': 'Трюм порожній.',
  'brief.inRange': 'У межах досяжності: {systems}',
  'brief.stranded': 'У межах досяжності: нічого — скінчилося пальне',
  'brief.opening': 'Командир {commander} за фахом {background}, літає на Блосі: {bays} вантажних відсіків, імпульсний лазер, без щитів. Політ щойно почався, а позиція така:',

  /* ---------- the words the plugin listens for ---------- */

  're.fight.attack': '\\b(вогонь|стріляй|стріляти|атакуй|бий)\\b',
  're.fight.flee': '\\b(тікай|тікати|відриваймося|тікаймо|геть звідси)\\b',
  're.fight.closeIn': '\\b(зблизитися|зблизься|ближче|скороти дистанц)',
  're.fight.openRange': '\\b(відійти|відійди|далі від них|розірви дистанц)',
  're.fight.submit': '\\b(допустити огляд|здаюся поліц|хай оглянуть|підкорися)\\b',
  're.fight.bribe': '\\b(хабар|дай хабар|відкупися|відкупитися)\\b',
  're.fight.surrender': '\\b(здатися|здаюся|здавайся|поступитися)\\b',
  're.fight.ignore': '\\b(ігнорувати|пройти мимо|не чіпай|лети далі)\\b',
  're.fight.plunder': '\\b(абордаж|на абордаж|обібрати|забрати вантаж)\\b',
  're.fight.endTurn': '\\b(не стріляти|тримати вогонь|чекати|пас)\\b',
  're.fight.auto': '\\b(хай іде само|виріши сам|програй за мене|авто)\\b',
  're.fight.on': '\\b(летимо далі|далі|продовжуй|наступний)\\b',

  're.buy': '^(купити|купи|купуй|візьми)$',
  're.sell': '^(продати|продай|продавай)$',
  're.warp': '^(лети|летіти|стрибок|стрибай|курс|прямуй)$',
  're.refuel': '^(заправитися|заправся|заправ|заправка|пальне)$',
  're.repair': '^(ремонт|полагодь|полагодити|відремонтувати)$',
  're.all': '^(усе|все|всі|максимум)$',
  're.restart': '\\b(нова гра|почати нову гру|заново|почати спочатку)\\b',
  're.close': '\\b(закрити гру|прибрати гру|вийти з гри|припинити гру)\\b',
  're.resume': '\\b(повернутися до гри|продовжити гру|відновити гру|знову на борт)\\b',
  're.start': '\\b(почати гру|зіграти в space trader|відкрити гру|граймо)\\b',
  're.intro': '^\\s*(зліт|старт)\\s*$',
  're.status': '^(статус|стан|позиц|де )',
  're.market': '^(ринок|ціни|торг)',
  're.chart': '^(карта|мапа|галактик)',
  're.ship': '^(корабель|судно)',
  're.news': '^(новини|газета)',
  're.jobs': '^(робот|контракт|завдання|замовлен)',
  're.new': '^нова( |$)',
};
