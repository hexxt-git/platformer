let Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Composite = Matter.Composite,
    Events = Matter.Events,
    log = console.log;
    container = document.getElementById("container"),
    width = container.clientWidth,
    height = container.clientHeight

random = (min, max) => Math.random()*(max-min)+min

let engine = Engine.create(),
    runner = Runner.create(),
    renderer = Render.create({
        element: container,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent',
        }
    })
engine.world.gravity.scale = 0.0015
let input_settings = {
    moving_speed: 0.0009,
    damping_speed: 0.05,
    jump_force: 10,
    dash_force: 0.01,
    jumps_left: 2,
    max_jumps: 2,
    dashes_left: 1,
    max_dashs: 1,
    is_jumping: false,
    is_sliding: false,
    dash_duration: 1000,
    dash_duration_timer: 0,
    dash_cooldown: 1000,
    jump_cooldown: 1000,
    dash_cooldown_timer: 0,
    jump_cooldown_timer: 0,
}
let inputs = {x: 0, dash:false, jump: false}

Render.run(renderer)
Runner.run(runner, engine)

let floor = Bodies.rectangle(width/2, height, width*10, 30, {isStatic: true, friction: 0})
floor.lable = 'floor'
let ball = Bodies.circle(width/2, height/2, 10, {restitution: 0.6, friction: 0, frictionAir: 0})
let sensor = Bodies.circle(width/2, height/2, 30, {isSensor: true, render: {fillStyle: 'transparent'}})
Body.setVelocity(ball, {x: random(-10, 10), y: random(-10, 10)})
Composite.add(engine.world, [floor, ball, sensor])

function reset_controls(){
    inputs.dash = false
    inputs.jump = false
}
function jump(){
    if(input_settings.jumps_left <= 0) return 0
    Body.setVelocity(ball, {x: ball.velocity.x, y: -input_settings.jump_force})
    input_settings.jumps_left--
}
function dash(){
    if(input_settings.dashes_left <= 0) return 0
    if(ball.velocity.x > 0) Body.applyForce(ball, ball.position, {x: +input_settings.dash_force, y: 0})
    if(ball.velocity.x < 0) Body.applyForce(ball, ball.position, {x: -input_settings.dash_force, y: 0})
    //input_settings.dashes_left--
}

Events.on(engine, 'beforeUpdate', () => {
    Body.setVelocity(ball, {
        x: ball.velocity.x*(1-input_settings.damping_speed),
        y: ball.velocity.y
    })
    Body.applyForce(ball, ball.position, {x: inputs.x*input_settings.moving_speed, y: 0})
    
    reset_controls()
})
Events.on(engine, 'afterUpdate', () => {
    Body.setPosition(sensor, ball.position)

})

Events.on(engine, 'collisionStart', (e) => {
    for(let pair of e.pairs){
        if(pair.bodyA == sensor && pair.bodyB.lable == 'floor' || pair.bodyA.lable == 'floor' && pair.bodyB == sensor){
            input_settings.jumps_left = input_settings.max_jumps
        }
    }
})
document.addEventListener('keydown', (e) => {
    if(e.key == "ArrowUp") jump()
    if(e.key == " ") jump()
    if(e.key == "ArrowDown") dash()
    if(e.key == "Shift") dash()
    if(e.key == "ArrowLeft") inputs.x = -1
    if(e.key == "ArrowRight") inputs.x = 1
})
document.addEventListener('keyup', (e) => {
    if(e.key == "ArrowLeft") inputs.x = 0
    if(e.key == "ArrowRight") inputs.x = 0
})