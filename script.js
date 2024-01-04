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
    height = container.clientHeight,
    gamer_over = false
let debugging = false

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
engine.world.gravity.scale = 0.0018
let input_settings = {
    moving_speed: 0.001,
    damping_speed: 0.07,
    jump_speed: 11,
    dash_vertical_speed: 3,
    dash_force: 0.05,
    jumps_left: 2,
    max_jumps: 2,
    max_dashs: 1,
    dash_cooldown: 2000,
    dash_cooldown_timer: 0,
}
engine.timing.timeScale = 1.0
engine.constraintIterations = 10
engine.positionIterations = 10


let inputs = {x: 0, dash:false, jump: false}
let time = 0
best_m = Math.floor(localStorage.getItem('best_time')/60000)
best_s = Math.floor(localStorage.getItem('best_time')/1000)%60
best_ms = Math.floor(localStorage.getItem('best_time')/10)%100
document.getElementById('best').innerHTML = `best: ${best_m}:${best_s<10?'0':''}${best_s}.${best_ms}${best_ms<10?'0':''}`

Render.run(renderer)
Runner.run(runner, engine)
Render.startViewTransform(renderer)

let floor = Bodies.rectangle(inf/2, height+15, inf, 60, {isStatic: true, friction: 0})
y0 = 15
floor.lable = 'platform'
floor.render.fillStyle = 'white'
let player = Bodies.circle(600, height-150, 15, {restitution: 0.6, friction: 0, frictionAir: 0, mass:0.5})
if(debugging) Body.setPosition(player, {x:parseFloat(localStorage.getItem('player_x')) || 500, y:parseFloat(localStorage.getItem('player_y'))||height-60})
player.render.fillStyle = 'white'
player.lable = 'player'
player.render.visible = false
let display_player = Bodies.circle(600, height-150, 15, {isStatic: true, isSensor: true, render: {fillStyle: 'white'}})
display_player.scale = {x: 1, y: 1}
let sensor1 = Bodies.circle(0, 0, 10, {isSensor: true, render: {fillStyle: '#fff0'}})
let sensor2 = Bodies.circle(0, 0, 10, {isSensor: true, render: {fillStyle: '#fff0'}})
sensor1.lable = 'sensor'
sensor2.lable = 'sensor'
let key = Bodies.rectangle(10350, height-858, 25, 25, {isStatic:true, isSensor: true, lable: 'key'})
let key_obtained = false
key.render.fillStyle = 'yellow'
let door = Bodies.rectangle(40, height-100-y0, 16, 300, {isStatic:true, lable: 'door'})
door.render.fillStyle = 'white'
door.render.strokeStyle = 'white'

Composite.add(engine.world, [floor, player, display_player, sensor1, sensor2, key, door])

for(let i = 0; i < level.length; i++){
    let x = level[i].x + level[i].w/2,
        y = height-level[i].y-level[i].h/2
    let block = Bodies.rectangle(x, y, level[i].w, level[i].h, {isStatic: true, friction: 0})
    block.render.fillStyle = 'white'
    block.render.strokeStyle = 'transparent'
    block.lable = 'platform'
    Composite.add(engine.world, block)
}
for(let i = 0; i < obsticles.length; i++){
    let x = obsticles[i].x + obsticles[i].w/2,
        y = height-obsticles[i].y - obsticles[i].h/2
    let block = Bodies.rectangle(x, y, obsticles[i].w, obsticles[i].h, {isStatic: true, friction: 0})
    block.render.fillStyle = 'red'
    block.render.strokeStyle = 'transparent'
    block.lable = 'obsticle'
    Composite.add(engine.world, block)
}

let camera = {x:1, y: 1},
    camera_min = {x:0,y:-1000},
    camera_max = {x:1000000, y:y0}
function shoot_jump_particles(){
    let particles = new particle_sys({x:player.position.x, y:player.position.y+20}, {x:-player.velocity.x, y:2}, 10, size=5, mass=0.1, bounce=0.8, variation=5, '#fff6', 'circle')
    particles.insert_to_world(engine.world)
    setTimeout(() => {
        particles.delete_from_world(engine.world)
    }, 600)
}
function jump(){
    if(inputs.y == -1) return 0
    inputs.y = -1
    if(input_settings.jumps_left <= 0) return 0
    Body.setVelocity(player, {x: player.velocity.x, y: -input_settings.jump_speed})
    shoot_jump_particles()
    input_settings.jumps_left--
}
function shoot_dash_particles(){
    let particles = new particle_sys(player.position, {x:-player.velocity.x*2, y:2}, 10, size=5, mass=0.1, bounce=0.8, variation=5, '#fff6', 'circle')
    particles.insert_to_world(engine.world)
    setTimeout(() => {
        particles.delete_from_world(engine.world)
    }, 600)
}
function dash(){
    if(input_settings.dash_cooldown_timer > 0) return 0
    if(Math.abs(player.velocity.x) < 0.1) return 0
    Body.applyForce(player, player.position, {x: inputs.x*input_settings.dash_force, y: 0})
    Body.setVelocity(player, {x: player.velocity.x, y: -input_settings.dash_vertical_speed})
    if(inputs.x == 0) Body.applyForce(player, player.position, {x: input_settings.dash_force*Math.sign(player.velocity.x), y: 0})
    shoot_dash_particles()
    input_settings.dash_cooldown_timer = input_settings.dash_cooldown
}
function lerp(a, b, k){
    return a*(1-k)+b*k
}

Events.on(engine, 'beforeUpdate', () => {
    Body.setVelocity(player, {
        x: player.velocity.x*(1-input_settings.damping_speed),
        y: player.velocity.y
    })
    Body.applyForce(player, player.position, {x: inputs.x*input_settings.moving_speed, y: 0})
    if(input_settings.dash_cooldown_timer > 1000/60) input_settings.dash_cooldown_timer -= 1000/60
    else{
        input_settings.dash_cooldown_timer = 0
    }
    desired_camera = {
        x: Math.max(Math.min(player.position.x-width/2, camera_max.x), camera_min.x),
        y: Math.max(Math.min(player.position.y-height/2, camera_max.y), camera_min.y)
    }
    camera.x = lerp(camera.x, desired_camera.x, 0.2)
    camera.y = lerp(camera.y, desired_camera.y, 0.2)
    renderer.bounds = {min: {x: camera.x, y: camera.y}, max: {x: camera.x+width, y: camera.y+height}}
    Render.startViewTransform(renderer)
    document.getElementById('container').style.backgroundPosition = `${-camera.x}px ${height+200-camera.y}px`
    document.getElementById('in-game-text-container').style.left = `${-camera.x}px`
    document.getElementById('in-game-text-container').style.top = `${-camera.y}px`
})
Events.on(engine, 'afterUpdate', () => {
    Body.setPosition(sensor1, {x:player.position.x+3, y:player.position.y+10})
    Body.setPosition(sensor2, {x:player.position.x-3, y:player.position.y+10})
    sensor1.lable = 'sensor'
    sensor2.lable = 'sensor'
    localStorage.setItem('player_x', player.position.x) // debugging
    localStorage.setItem('player_y', player.position.y)
    time += 1000/60
    let m = Math.floor(time/60000),
        s = Math.floor(time/1000)%60,
        ms = Math.floor(time/10)%100
    document.getElementById('time').innerHTML = `time: ${m}:${s<10?'0':''}${s}.${ms}${ms<10?'0':''}`
    if(player.position.y > height+500){
        Body.setPosition(player, {x:player.position.x, y:height-60})
        lose()
    }
    document.getElementById('dash-meter-fill').style.width = `${100-100*input_settings.dash_cooldown_timer/input_settings.dash_cooldown}%`
    Body.setPosition(display_player, player.position)
    Body.setVelocity(display_player, player.velocity)
    Body.scale(display_player, 1/display_player.scale.x, 1/display_player.scale.y)
    let magnitude = Math.sqrt(player.velocity.x**2+player.velocity.y**2) * 0.02
    let angle = Math.atan2(player.velocity.y, player.velocity.x)
    display_player.scale.x = 1+magnitude*Math.abs(Math.cos(angle))
    display_player.scale.y = 1+magnitude*Math.abs(Math.sin(angle))

    Body.scale(display_player, display_player.scale.x, display_player.scale.y)
})

function lose(){
    if(debugging){
        display_player.render.fillStyle = 'red'
        setTimeout(() => {
            display_player.render.fillStyle = 'white'
        }, 1000)
        return 0
    }
    if(gamer_over) return 0
    gamer_over = true
    display_player.render.fillStyle = 'red'
    setTimeout(() => {
    alert(`
        You lost!
        you survived ${document.getElementById('time').innerHTML}
    `)
    location.reload()}, 300)
}
function win(){
    if(gamer_over) return 0
    gamer_over = true
    setTimeout(() => {
    alert(`
        You won!
        you made it in ${document.getElementById('time').innerHTML}
    `)
    if(localStorage.getItem('best_time') == null || localStorage.getItem('best_time') > time){
        localStorage.setItem('best_time', time)
        alert(`New best time! ${document.getElementById('time').innerHTML}`)
    }
    location.reload()}, 300)
}
function reset_pos(){
    Body.setPosition(player, {x:500, y:height-60})
}
Events.on(engine, 'collisionStart', (e) => {
    for(let pair of e.pairs){
        if(pair.bodyA == player && pair.bodyB.lable == 'obsticle' || pair.bodyA.lable == 'obsticle' && pair.bodyB == player){
            lose()
        }
        if(pair.bodyA == player && pair.bodyB.lable == 'key' || pair.bodyA.lable == 'key' && pair.bodyB == player){
            Composite.remove(engine.world, key)
            key_obtained = true
        }
        if(pair.bodyA == player && pair.bodyB.lable == 'door' || pair.bodyA.lable == 'door' && pair.bodyB == player){
            if(key_obtained){
                win()
            }
        }
    }
})
Events.on(engine, 'collisionActive', (e) => {
    for(let pair of e.pairs){
        if(pair.bodyA.lable == 'sensor' && pair.bodyB.lable == 'platform' || pair.bodyA.lable == 'platform' && pair.bodyB.lable == 'sensor'){
            input_settings.jumps_left = input_settings.max_jumps
        }
        if(pair.bodyA.lable == 'sensor' && pair.bodyB.lable == 'door' || pair.bodyA.lable == 'door' && pair.bodyB.lable == 'sensor'){
            input_settings.jumps_left = input_settings.max_jumps
        }
    }
})

key_binds = {
    jump_keys:  [' ', 'w', 'W', 'ArrowUp'],
    dash_keys:  ['Shift', 's', 'S', 'ArrowDown'],
    left_keys:  ['a', 'A', 'ArrowLeft'],
    right_keys: ['d', 'D', 'ArrowRight'],
    restart:    ['r', 'R', 'Escape', 'Delete'],
}
document.addEventListener('keydown', (e) => {
    if(key_binds.jump_keys.includes(e.key)) jump()
    if(key_binds.dash_keys.includes(e.key)) dash()
    if(key_binds.left_keys.includes(e.key) ) inputs.x = -1
    if(key_binds.right_keys.includes(e.key)) inputs.x = +1
    if(key_binds.restart.includes(e.key)) location.reload()
})
document.addEventListener('keyup', (e) => {
    if(key_binds.left_keys.includes(e.key) ) inputs.x = 0
    if(key_binds.right_keys.includes(e.key)) inputs.x = 0
    if(key_binds.jump_keys.includes(e.key)) inputs.y = 0
})
document.addEventListener("DOMContentLoaded", () => {
    window.addEventListener("resize", () => {
        location.reload();
    });
});