const { Engine,  Render, Runner, World, MouseConstraint, Mouse, Bodies, Body, Events } = Matter;

//maze configuration variables
const cellsHorizontal = window.innerWidth < 600 ? 4 : 8;
const cellsVertical = window.innerWidth < 600 ? 6 : 8;
const width = window.innerWidth < 600 ? innerWidth : window.innerWidth - 1;
const height = window.innerHeight - 4;//border
const borderThickness = 5;
const mazewallThickness = 7;


const cellWidth = width / cellsHorizontal;
const cellHeight = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
})
Render.run(render);
Runner.run(Runner.create(), engine);

//The border walls of the box
const walls = [
    Bodies.rectangle(width / 2, 0, width, borderThickness, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, borderThickness, { isStatic: true }),
    Bodies.rectangle(0, height / 2, borderThickness, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, borderThickness, height, { isStatic: true })
];
World.add(world, walls);

//Maze generation
//shuffle array function for randomizing the neighbours
const shuffle = (arr) =>{
    let counter = arr.length;

    while(counter > 0){
        const index = Math.floor(Math.random() * counter);
        counter--;

        const temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }
    return arr;
}

//creating grids
const grid = Array(cellsVertical).fill(null).map(()=>{ return Array(cellsHorizontal).fill(false) });
const verticalWalls = Array(cellsVertical).fill(null).map(()=> Array(cellsHorizontal - 1).fill(false));//implicite return of map
const horizontalWalls = Array(cellsVertical - 1).fill(null).map(()=> Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) =>{
  //If I have visited that cell at[row, column], then return
    if(grid[row][column]) return;
  //mark this cell as been visited
    grid[row][column] = true;
  //Assemble randomly ordered list of neighbours
    const neighbours = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ]);
  //For each neighbour...
    for(let neighbour of neighbours){
        const [nextRow, nextColumn, direction] = neighbour;
  //See if that neighbour is out of bounds
        if(nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal){
            continue;//do nothing...just move on to next neighbour
        }
  //If we have visited that neighbour,continue to next neighbour
        if(grid[nextRow][nextColumn]){
            continue;
        }
  //Remove a wall from either horizontals or verticals
        if(direction === 'left'){
            verticalWalls[row][column - 1] = true;
        }else if(direction === 'right'){
            verticalWalls[row][column] = true;
        }else if(direction === 'up'){
            horizontalWalls[row - 1][column] = true;
        }else if(direction === 'down'){
            horizontalWalls[row][column] = true;
        }
        stepThroughCell(nextRow, nextColumn);
    }
  //Visit the next cell
}
stepThroughCell(startRow, startColumn);

//drawing maze walss using horizontalWalls array
horizontalWalls.forEach((row, rowIndex)=>{
    row.forEach((open, columnIndex)=>{
        if(open){
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * cellWidth + cellWidth / 2,
            rowIndex * cellHeight + cellHeight,
            cellWidth,
            10,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: '#c70039'
                }
            }
        );
        World.add(world, wall);
    });
});

verticalWalls.forEach((row, rowIndex)=>{
    row.forEach((open, columnIndex)=>{
        if(open){
            return;
        }
        const wall = Bodies.rectangle(
            columnIndex * cellWidth + cellWidth,
            rowIndex * cellHeight + cellHeight / 2,
            mazewallThickness,
            cellHeight,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: '#c70039'
                }
            }
        );
        World.add(world, wall);
    });
});

//Goal
const goal = Bodies.rectangle(
    width - cellWidth / 2,
    height - cellHeight / 2,
    cellWidth * .7,
    cellHeight * .7,
    {
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: 'green'
        }
    }
);
World.add(world, goal);

//Ball
const ballRadius = Math.min(cellWidth, cellHeight) / 3;
const ball = Bodies.circle(
    cellWidth / 2,
    cellHeight / 2,
    ballRadius,
    {
        label: 'ball',
        render: {
            fillStyle: '#f05454'
        }
    }
);
World.add(world, ball);

//keypresses
window.addEventListener('keydown', event =>{
    
    const { x, y } = ball.velocity;
    if(event.code === 'KeyW'){
        Body.setVelocity(ball, { x, y: y - 5});
    }

    if(event.code === 'KeyD'){
        Body.setVelocity(ball, { x: x+5, y});
    }

    if(event.code === 'KeyS'){
        Body.setVelocity(ball, { x, y: y + 5});
    }

    if(event.code === 'KeyA'){
        Body.setVelocity(ball, { x: x - 5, y});
    }
});

//Win condition
Events.on(engine, 'collisionStart', event =>{
    event.pairs.forEach((collision)=>{
        const labels = ['goal', 'ball'];
        if(labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)){
            document.querySelector('.winner').classList.remove('hidden');
            world.gravity.y = 1;
            world.bodies.forEach((body)=>{
                if(body.label === 'wall'){
                    Body.setStatic(body, false);
                }
            })
        }
    });
});

document.querySelector('#refresh').addEventListener('click', (e)=>{
    window.location.reload();
})

window.addEventListener('load', ()=>{
    if(window.innerWidth < 600){
        document.querySelector('.buttons').classList.remove('hidden');
    }
});

document.querySelectorAll('.buttons button i').forEach(function(button){
    button.addEventListener('click', function(e){
        console.log(e.target.id);
        const { x, y } = ball.velocity;
        if(e.target.id === 'ArrowUp'){
            console.log('move up');
            Body.setVelocity(ball, {x,y: y-5});
        }
        if(e.target.id === 'ArrowDown'){
            console.log('move down');
            Body.setVelocity(ball, {x, y:y+5});
        }
        if(e.target.id === 'ArrowLeft'){
            console.log('move left');
            Body.setVelocity(ball, {x:x-5, y});
        }
        if(e.target.id === 'ArrowRight'){
            console.log('move right');
            Body.setVelocity(ball, {x:x+5, y});
        }
    });
});