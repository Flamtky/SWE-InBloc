<script context="module">
    import '$lib/firebase.js';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';
	export async function load({ params }) {
        let {id, wall} = params;
        let gym = null;
		let routes = null;
		if (getAuth().currentUser) {
			console.log('ICH LADE');
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${id}`, {
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
			
                
				res = await fetch(`https://flamtkzx.flamtky.dev/routes?gymId=${id}&wallId=${wall}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				});
				if (res.ok) {
					json = await res.json();
					routes = Object.entries(json.data.routes);
					console.log('ICH HABE ROUTES DATEN');
					console.log(routes);
				} else {
					console.log('No routes found');
					routes = null;
				}
			}
				console.log('ICH HABE FERTIG');
				return {
					props: {
						gym,
						routes
					}
				};
			
		}
		return {
			props: {
				gym,
				routes
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

    async function reload(){
        let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${id}`, {
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
			
                
				res = await fetch(`https://flamtkzx.flamtky.dev/routes?gymId=${id}&wallId=${wall}`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				});
				if (res.ok) {
					json = await res.json();
					routes = Object.entries(json.data.routes);
					console.log(routes);
				} else {
					console.log('No routes found');
					routes = null;
				}
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

{#if gym != null}
<Wall name={gym.name} gym={gym} gymId={id} wall_name={wall} routes={routes}/>
{/if}

