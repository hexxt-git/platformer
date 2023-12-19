class particle_sys {
    constructor(pos, vel, number, size=10, mass=1, bounce=0.5, variation=5, color='white', shape='square') {
        this.number = number
        this.size = size
        this.mass = mass
        this.bounce = bounce
        this.color = color
        this.shape = shape == 'circle' ? 'circle' : 'square'
        this.particles = []
        this.recreate(pos, vel, variation)
    }
    recreate(pos, vel, variation){
        this.particles = []
        for(let i = 0 ; i < this.number ; i++){
            let new_particle;
            if(this.shape == 'circle') new_particle = Bodies.circle(pos.x, pos.y, this.size/2)
            else new_particle = Bodies.rectangle(pos.x, pos.y, this.size, this.size)
            new_particle.friction = 0
            new_particle.restitution = this.bounce
            new_particle.mass = this.mass
            new_particle.render.fillStyle = this.color
            new_particle.render.strokeStyle = 'transparent'            
            new_particle.lable = 'particle'
            vel.x += (Math.random()*2-1)*variation
            vel.y += (Math.random()*2-1)*variation
            Body.setVelocity(new_particle, vel)
            this.particles.push(new_particle)
        }
    }
    insert_to_world(world){
        Composite.add(world, this.particles)
    }
    delete_from_world(world){
        Composite.remove(world, this.particles)
    }
}