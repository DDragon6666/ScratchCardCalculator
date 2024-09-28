const { reward } = require('./line_value');
const gbm = require('./get_best_move');

const grid = Array.from({ length: 3 }, () => Array(3).fill(0));

const linePositions = [
    [[0, 0], [1, 1], [2, 2]],
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[2, 0], [1, 1], [0, 2]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]]
];

const lineNames = [
    'up left diagonal',
    'v - left',
    'v - middle',
    'v - right',
    'up right diagonal',
    'h - top',
    'h - middle',
    'h - bottom'
];

const squareNames = [
    'top left',
    'top',
    'top right',
    'left',
    'middle',
    'right',
    'bottom left',
    'bottom',
    'bottom right'
];

const rewards = {
    6: 1680,
    7: 84,
    8: 630,
    9: 280,
    10: 42,
    11: 34,
    12: 180,
    13: 120,
    14: 53,
    15: 105,
    16: 53,
    17: 144,
    18: 48,
    19: 202,
    20: 105,
    21: 51,
    22: 420,
    23: 840,
    24: 1008
};

function rewardFunction(reward) {
    // Placeholder for possible sqrt adjustment
    return reward;
}

function reward(lineTuple) {
    return rewardFunction(rewards[sum(lineTuple)]);
}

function unalteredReward(lineTuple) {
    return rewards[sum(lineTuple)];
}

function sum(tuple) {
    return tuple.reduce((acc, val) => acc + val, 0);
}

function gridToTuple(grid) {
    return grid.map(row => [...row]); // Create a shallow copy of the grid
}

function getGridValue(grid, mode = "avg") {
    const numbersUsed = [];
    for (const row of grid) {
        for (const number of row) {
            if (!number) continue;
            numbersUsed.push(number);
        }
    }

    const unusedNumbers = Array.from({ length: 9 }, (_, i) => i + 1).filter(number => !numbersUsed.includes(number));

    const optionScores = [];
    for (let lineNumber = 0; lineNumber < linePositions.length; lineNumber++) {
        let totalValue = 0;
        let minValue = Infinity;
        let possibilities = 0;
        const lineValues = [
            grid[linePositions[lineNumber][0][1]][linePositions[lineNumber][0][0]],
            grid[linePositions[lineNumber][1][1]][linePositions[lineNumber][1][0]],
            grid[linePositions[lineNumber][2][1]][linePositions[lineNumber][2][0]]
        ];
        const lineValuesCopy = [...lineValues];

        for (const value1 of (lineValues[0] ? [lineValues[0]] : unusedNumbers)) {
            lineValuesCopy[0] = value1;
            for (const value2 of (lineValues[1] ? [lineValues[1]] : unusedNumbers)) {
                if (value2 === value1) continue;
                lineValuesCopy[1] = value2;
                for (const value3 of (lineValues[2] ? [lineValues[2]] : unusedNumbers)) {
                    if (value3 === value1 || value3 === value2) continue;
                    lineValuesCopy[2] = value3;

                    possibilities++;
                    const value = reward(lineValuesCopy);
                    totalValue += value;
                    minValue = Math.min(value, minValue);
                }
            }
        }

        optionScores.push([totalValue / possibilities, minValue]);
    }

    if (mode.toLowerCase() === 'avg') {
        optionScores.sort((a, b) => b[0] - a[0]);
        return optionScores[0][0];
    }
    if (mode.toLowerCase() === 'min') {
        optionScores.sort((a, b) => b[1] - a[1]);
        return optionScores[0][1];
    }
}

const cache = new Map();

function getBestMove(gridTuple, mode = 'avg', printAvg = false) {
    const grid = gridTuple.map(row => [...row]); // Convert back to a mutable list for processing

    const emptyPositions = [];
    const usedNumbers = new Set();
    
    for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
            usedNumbers.add(grid[y][x]);
            if (grid[y][x] === 0) {
                emptyPositions.push([x, y]);
            }
        }
    }

    if (emptyPositions.length <= 5) {
        return [0, getGridValue(grid)];
    }

    const unusedNumbers = new Set(Array.from({ length: 9 }, (_, i) => i + 1).filter(num => !usedNumbers.has(num)));

    let bestMove = [0, 0];
    let bestMoveValue = 0;

    for (const [x, y] of emptyPositions) {
        let possibilities = 0;
        let moveValue = 0;

        for (const number of unusedNumbers) {
            grid[y][x] = number;
            const gridTupleed = gridToTuple(grid);
            const key = JSON.stringify(gridTupleed);
            let thisAvg;

            if (cache.has(key)) {
                thisAvg = cache.get(key);
            } else {
                const result = getBestMove(gridTupleed, mode);
                thisAvg = result[1];
                cache.set(key, thisAvg);
            }

            possibilities++;
            moveValue += thisAvg;
        }

        grid[y][x] = 0; // Reset the grid after trying the move
        if (possibilities === 0) continue;

        const avg = moveValue / possibilities;
        if (bestMoveValue < avg) {
            bestMoveValue = avg;
            bestMove = [x, y];
        }
        if (printAvg) {
            console.log('X:', x, 'Y:', y, 'AVG:', avg);
        }
    }

    return [bestMove, bestMoveValue];
}
