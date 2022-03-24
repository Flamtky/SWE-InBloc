<script context="module">
	import GymSite from '$lib/gym.svelte';
	import { browser } from '$app/env';
	import { loggedin_user } from '$lib/stores.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import '$lib/firebase.js';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';
	export async function load({ params }) {
		const { id } = params;
		let gym = null;
		let image_url = null;
		let opening_hours = null;
		let walls = null;
		let override_opening_hours = null;
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

				res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${id}/logo`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				});
				if (res.ok) {
					json = await res.json();
					image_url = json.data.logo;
					console.log(image_url);
				} else {
					image_url =
						'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.antenneniederrhein.de%2Fexternalimages%2F%3Fsource%3Djpg248%2Fboulderhalle-kleve.jpg%26crop%3D0x125x6000x3750%26resize%3D1280x800%26dt%3D202007130845510&f=1&nofb=1';
				}
				console.log('ICH HABE IMAGE URL');

				res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${id}/openings`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				});
				if (res.ok) {
					json = await res.json();
					opening_hours = json.data.openings;
					console.log(opening_hours);
				} else {
					console.log('No opening hours found');
					opening_hours = null;
				}
				console.log('ICH HABE OPENING HOURS');

				res = await fetch(`https://flamtkzx.flamtky.dev/walls?gymId=${id}`, {
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

				res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${id}/holidays`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				});
				if (res.ok) {
					json = await res.json();
					override_opening_hours = Object.entries(json.data.overriddenOpenings);
				} else {
					console.log('No override opening hours found');
					override_opening_hours = null;
				}

				console.log('ICH HABE FERTIG');
				return {
					props: {
						gym,
						image_url,
						opening_hours,
						walls,
						override_opening_hours
					}
				};
			}
		}
		return {
			props: {
				gym,
				image_url,
				opening_hours,
				walls,
				override_opening_hours
			}
		};
	}
</script>

<script>
	export let gym;
	export let image_url;
	export let opening_hours;
	export let walls;
	export let override_opening_hours;

	async function reload() {
		const { id } = $page.params;
		let uid = getAuth().currentUser.uid;
		let token = await getAuth().currentUser.getIdToken(true);
		let res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${id}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		let json = await res.json();
		console.log(json.data.gym);
		gym = json.data.gym;

		res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${id}/logo`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (res.ok) {
			json = await res.json();
			image_url = json.data.logo;
			console.log(image_url);
		} else {
			image_url =
				'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.antenneniederrhein.de%2Fexternalimages%2F%3Fsource%3Djpg248%2Fboulderhalle-kleve.jpg%26crop%3D0x125x6000x3750%26resize%3D1280x800%26dt%3D202007130845510&f=1&nofb=1';
		}

		res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${id}/openings`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (res.ok) {
			json = await res.json();
			opening_hours = json.data.openings;
			console.log(opening_hours);
		} else {
			opening_hours = null;
		}

		res = await fetch(`https://flamtkzx.flamtky.dev/walls?gymId=${id}`, {
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
			walls = [];
		}

		res = await fetch(`https://flamtkzx.flamtky.dev/gyms/${id}/holidays`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});
		if (res.ok) {
			json = await res.json();
			override_opening_hours = Object.entries(json.data.overriddenOpenings);
			console.log(override_opening_hours);
		} else {
			override_opening_hours = null;
		}
	}

	onAuthStateChanged(getAuth(), async (user) => {
		if (user) {
			if (!gym) {
				await reload();
			}
		} else {
			gym = null;
		}
	});
</script>

{#if gym != null}
	<GymSite
		name={gym.name}
		desc={gym.description}
		{image_url}
		adresse={gym.name + ' ' + gym.street + ' ' + gym.houseNumber + ' ' + gym.zip + ' ' + gym.city}
		email={gym.email}
		phone={gym.phone}
		website={gym.website}
		{opening_hours}
		{override_opening_hours}
		Walls={walls}
	/>
{/if}
