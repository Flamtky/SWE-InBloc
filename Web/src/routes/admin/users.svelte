<script>
	import '../../lib/firebase.js';
	import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
	import Card from '$lib/usercard.svelte';
	let users = [
		{
			username: 'Username69',
			email: 'name@domain.com',
			country: 'Germany',
			city: 'Berlin',
			zip: '12345',
			birthdate: '2019-08-24'
		},
		{
			username: 'Username69',
			email: 'name@domain.com',
			country: 'Germany',
			city: 'Berlin',
			zip: '12345',
			birthdate: '2019-08-24'
		},
		{
			username: 'Username69',
			email: 'name@domain.com',
			country: 'Germany',
			city: 'Berlin',
			zip: '12345',
			birthdate: '2019-08-24'
		}
	];
	
	async function a(){ //TODO remove
		//var token = await getAuth().currentUser.getIdToken(true);
		var uid = await getAuth().currentUser.uid;
		const source = new EventSource("http://localhost:1337/users/" + uid + "/stream",);
		source.addEventListener('message', function(e) {
			console.log(e.data);
		});
	}
	

	
</script>

<div class="container">
	{#each users as card}
		<Card user={card} />
	{/each}
	<button on:click={a}>Stream</button>
</div>


