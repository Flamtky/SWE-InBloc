<script>
    import '../lib/firebase.js';
	import {
		getAuth,
        onAuthStateChanged
	} from 'firebase/auth';
	import { loggedin_user, local_user_data, firstLogin } from '$lib/stores.js';
	import { browser } from '$app/env';

    let local_data=null;
    let completedFeatures = null;
    async function load(){
        if (getAuth().currentUser) {
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch(
				`https://flamtkzx.flamtky.dev/users/${uid}`,
				{
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					}
				}
			);
			if (res.ok) {
				let json = await res.json();
				local_data = Object.entries(json.data);
                console.log(local_data);
                completedFeatures = Object.entries(local_data[0][1].completedFeatures);
                console.log(completedFeatures);

			}
		}
    }

    onAuthStateChanged(getAuth(), async (user) => {
        if (user) {
            if (!local_data) {
                await load();
            }
        } else {
            local_data = null;
        }
    });

</script>

{#if local_data && local_data[0][1].avgDifficulty}
<h3>The average difficulty of your Completed Routes: {local_data[0][1].avgDifficulty}</h3>
<h3>You completed {local_data[0][1].completedRoutes} routes</h3>
<h3>You flashed {local_data[0][1].completedRoutes} of your completed routes</h3>
<h3>You completed routes with the following features</h3>
{#each completedFeatures as [feature, value]}
<h5>{feature}</h5>
{/each}
{:else}
<h3>You have not completed any routes yet</h3>
{/if}