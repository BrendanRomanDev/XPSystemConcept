const hrInput = document.querySelector('#hrInput');
const minInput = document.querySelector('#minInput');
const timeLogBtn = document.querySelector('#timeLogBtn');
const maxHrInput = document.querySelector('#targetHrs');
const numLvlInput = document.querySelector('#targetLvls');

timeLogBtn.addEventListener('click', () => updateStats());
let lvlUpCriteriaArr = [ { lvl: 0, runningExpTotal: 0 } ];
let currentLvl = 0;
const timeLogArr = [];

const updateStats = async () => {
	const goalData = {};
	let hrs = +hrInput.value;
	let mins = +minInput.value;
	let maxHrs = +maxHrInput.value;
	let targetLvls = +numLvlInput.value;
	let currentLvlField = document.querySelector('#currentLvlField');
	let investedTimeField = document.querySelector('#investedTimeField');
	let lvlXPStatField = document.querySelector('#lvlXPStatField');
	let percentCompleteField = document.querySelector('#percentCompleteField');
	let userInputMs = convertToMs(hrs, mins);

	timeLogArr.push(userInputMs);
	/// we are re-definingLvlUpCriteriaArr
	lvlUpCriteriaArr = populateLvlUpCriteria(maxHrs, targetLvls, lvlUpCriteriaArr);
	updateGoalData(goalData, maxHrs, targetLvls);

	const investedMsAKAXP = timeLogArr.reduce((sum, currValue) => {
		return sum + currValue;
	}, 0);

	const investedHrs = Math.floor(investedMsAKAXP / 3600000);
	const investedMins = Math.floor((investedMsAKAXP - investedHrs * 3600000) / 60000);
	investedTimeField.innerHTML = `${investedHrs} Hours, ${investedMins} Minutes`;

	/// define the base level stats.
	let currentLvlStats = lvlUpCriteriaArr[currentLvl];
	let nextLvlStats = lvlUpCriteriaArr[currentLvl + 1];
	let currentLvlXPBase = investedMsAKAXP - currentLvlStats.runningExpTotal;
	let currentLvlXPMax = Math.floor(nextLvlStats.runningExpTotal - currentLvlStats.runningExpTotal);
	let barValue = 0;
	if (currentLvlXPBase >= currentLvlXPMax) {
		currentLvl++;
		currentLvlStats = lvlUpCriteriaArr[currentLvl];
		nextLvlStats = lvlUpCriteriaArr[currentLvl + 1];
		currentLvlXPBase = investedMsAKAXP - currentLvlStats.runningExpTotal;
		currentLvlXPMax = Math.floor(nextLvlStats.runningExpTotal - currentLvlStats.runningExpTotal);
		await animateBar();
	}

	currentLvlPercentCompletion = Math.floor(currentLvlXPBase / currentLvlXPMax * 100);
	barValue = currentLvlPercentCompletion;
	currentLvlField.innerHTML = `${currentLvl}`;
	lvlXPStatField.innerHTML = `${currentLvlXPBase} / ${currentLvlXPMax}`;
	percentCompleteField.innerHTML = `${currentLvlPercentCompletion} %`;
	$('.loading-item-1').css('width', barValue + '%').attr('aria-valuenow', barValue).text(`${barValue} %`);
};

const animateBar = async (barValue) => {
	await lvlUpBar(100, 0);
	await lvlUpBar(0, 250);
	await lvlUpBar(barValue, 600);
};

const lvlUpBar = (barValue, delay) => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			$('.loading-item-1').css('width', barValue + '%').attr('aria-valuenow', barValue).text(`${barValue} %`);
			resolve();
		}, delay);
	});
};

const updateGoalData = (goalData, maxHrs, numLvls) => {
	if (!goalData.maxHrs || !goalData.numLvls) {
		goalData.maxHrs = maxHrs;
		goalData.numLvls = numLvls;
	}
};

const convertToMs = (hrs, mins = 0) => {
	const convertedMs = hrs * 3600000 + mins * 60000;
	return convertedMs;
};

const populateLvlUpCriteria = (maxHrs, numLvls = 100, initialCriteriaArr) => {
	const xpFirstLvl = maxHrs * 3600000 * 0.005;
	console.log('xpFirstLvl', xpFirstLvl);
	const xpLastLvl = maxHrs * 3600000 * 0.05;

	let runningExpTotal = 0;

	const B = Math.log(xpLastLvl / xpFirstLvl) / (numLvls - 1);
	const A = xpFirstLvl / (Math.exp(B) - 1);

	/// if initial LVL up table is already populated, clear it.
	if (initialCriteriaArr) {
		initialCriteriaArr = [ { lvl: 0, runningExpTotal: 0 } ];
	}
	/// push values to initial Criteria Array
	for (let lvl = 1; lvl <= numLvls; lvl++) {
		const oldXP = Math.round(A * Math.exp(B * (lvl - 1)));
		const newXP = Math.round(A * Math.exp(B * lvl));
		runningExpTotal += newXP;
		initialCriteriaArr.push({ lvl, newXP, runningExpTotal });
	}

	const actual = maxHrs * 3600000;
	const result = initialCriteriaArr[initialCriteriaArr.length - 1].runningExpTotal;
	const ratio = actual / result;

	const lvlUpCriteria = initialCriteriaArr.map((lvl) => {
		return { lvl: lvl.lvl, runningExpTotal: Math.floor(lvl.runningExpTotal * ratio) };
	});

	console.log('lvlUpCriteria: ', lvlUpCriteria);
	return lvlUpCriteria;
};
