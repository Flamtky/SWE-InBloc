<script context="module">
    import '$lib/firebase.js';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';
	export async function load({ params }) {
        let {id, wall} = params;
        let gym = null;
		if (getAuth().currentUser) {
			console.log('ICH LADE');
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch(`http://localhost:1337/gyms/${id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});
			if (res.ok) {
				let json = await res.json();
				console.log(json);
				gym = json.data.gym;
                console.log('ICH HABE GYM DATEN');

                
				/* res = await fetch(`http://localhost:1337/walls?gymId=${id}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				});
				if (res.ok) {
					json = await res.json();
					walls = Object.entries(json.data.walls);
					console.log(walls);
				} else {
					console.log('No Walls found');
					walls = [];
				}
				console.log('ICH HABE FERTIG'); */
				return {
					props: {
						gym
					}
				};
			}
		}
		return {
			props: {
				gym
			}
		};
	}
</script>

<script>
    import Wall from '$lib/wall.svelte';
    import { page } from '$app/stores';
    let {id, wall} = $page.params

    export let gym;
    export let routes;
    //TODO: get route from the wall

    async function reload(){
        let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch(`http://localhost:1337/gyms/${id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});
			if (res.ok) {
				let json = await res.json();
				console.log(json);
				gym = json.data.gym;

                
				/* res = await fetch(`http://localhost:1337/walls?gymId=${id}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				});
				if (res.ok) {
					json = await res.json();
					walls = Object.entries(json.data.walls);
					console.log(walls);
				} else {
					console.log('No Walls found');
					walls = [];
				}
				console.log('ICH HABE FERTIG'); */
			}
		}

    onAuthStateChanged(getAuth(), async (user) => {
		if (user) {
            if(!gym) {
                await reload();
            }
		} else {
			gym = null;
		}
	});
</script>

{#if gym}
<Wall name={gym.name} gym={gym} gymId={id} wall_name={wall}/>
{/if}