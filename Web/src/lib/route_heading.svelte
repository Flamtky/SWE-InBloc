<script>
	import { goto } from '$app/navigation';
	import { loggedin_user, local_user_data, firstLogin } from '$lib/stores.js';
	import { browser } from '$app/env';
    import { page } from '$app/stores';
    import '$lib/firebase.js';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';


    export let id=null;
    export let wall=null;
    export let route=null;
    let user_completed = null;
    let route_data = null;
    let written_comment = null;

	async function load() {
		if (getAuth().currentUser) {
			let uid = getAuth().currentUser.uid;
			let token = await getAuth().currentUser.getIdToken(true);
			let res = await fetch(`https://flamtkzx.flamtky.dev/routes/${route}?gymId=${id}&wallId=${wall}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});
            if(res.ok){
                let json = await res.json();
                route_data = json.data.route;
            }

            res = await fetch(`https://flamtkzx.flamtky.dev/routes/${route}/complete?gymId=${id}&wallId=${wall}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            if(res.ok){
                let json = await res.json();
                user_completed = json.data.hasCompletedRoute;
            }
		}
	}

    async function send_comment(){
        if(written_comment != null || written_comment != ""){
            let uid = getAuth().currentUser.uid;
            let token = await getAuth().currentUser.getIdToken(true);
            console.log(Date.now());
            let res = await fetch(`https://flamtkzx.flamtky.dev/routes/${route}/comments?gymId=${id}&wallId=${wall}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    comment:{
                    message: written_comment,
                    timestamp: Math.floor(Date.now()/1000).toString(),
                }
                })
            });
            if(res.ok){
                written_comment = null;
            }
        }
    }

    async function route_completed(){
        let uid = getAuth().currentUser.uid;
        let token = await getAuth().currentUser.getIdToken(true);
        let res = await fetch(`https://flamtkzx.flamtky.dev/routes/${route}/complete?gymId=${id}&wallId=${wall}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });
        if(res.ok){
            await load();
        }
    }

    async function route_flashed(){
        let uid = getAuth().currentUser.uid;
        let token = await getAuth().currentUser.getIdToken(true);
        let res = await fetch(`https://flamtkzx.flamtky.dev/routes/${route}/complete?gymId=${id}&wallId=${wall}&flashed=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });
        if(res.ok){
            await load();
        }
    }

    async function route_uncomplete(){
        let uid = getAuth().currentUser.uid;
        let token = await getAuth().currentUser.getIdToken(true);
        let res = await fetch(`https://flamtkzx.flamtky.dev/routes/${route}/complete?gymId=${id}&wallId=${wall}&flashed=true`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });
        if(res.ok){
            await load();
        }
    }

    
    onAuthStateChanged(getAuth(), async (user) => {
        if(user){
            await load();
        }else{
            route_data = null;
        }
    });
</script>

<div class="container">
   <!-- Start: Heading -->
    {#if route_data}
    <div class="order-sm-first order-md-first order-lg-last order-xl-last order-xxl-last" style="background: rgba(0,0,0,0);border-radius: 10px;border: 2px solid rgba(0,0,0,0.25);padding: 0px;padding-left: 5px;padding-right: 5px;width: 350px;margin-top: 10px;">
        <div class="d-flex justify-content-evenly">
            <h1>{route}</h1>
        </div>
        <h2>Difficulty: {route_data.difficulty}</h2>
        <h5>Features: {route_data.features}</h5>
        {#if route_data.completedCount}
        <small class="text-muted">This Route has been completed {route_data.completedCount} times</small>
        {:else}
        <small class="text-muted">This Route has been completed 0 times</small>
        {/if}
        <div class="d-flex flex-column flex-grow-1 justify-content-xxl-end align-items-xxl-center" style="height: 180px;">
            <textarea placeholder="I think this Route has the perfect difficulty..." bind:value={written_comment} style="height: 130px;width: 330px;margin-bottom: 5px;"/>
            <button class="btn btn-info d-flex round" type="button" style="margin-bottom: 5px;" on:click={send_comment}>Leave a review</button></div>
    </div><!-- End: Heading -->
    {/if}
    <div class="order-first">
        <div class="col"><img class="flex-grow-1 flex-shrink-1 order-first" src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fmomentum-concepts.at%2Fwp-content%2Fuploads%2F2019%2F04%2F20140801_162320_resized.jpg&amp;f=1&amp;nofb=1" style="margin-top: 40px;min-height: 50px;max-height: 250px;">
            
        </div>
        <div  style="display: flex;flex-direction: row;margin-top:15px;margin-left:10px">
            {#if !user_completed}
            <button class="btn btn-info round" type="button" style="margin-right: 5vw;max-height: 40px; max-width: 104px;" on:click={route_completed}>Completed</button>
            <button class="btn btn-info round" type="button" style="max-height: 40px; width: 104px;" on:click={route_flashed}>Flashed</button>
            {:else}
            <button class="btn btn-info round" type="button" style="max-height: 40px; width: 104px;" on:click={route_uncomplete}>Uncomplete</button>
            {/if}
        </div>
    </div>
</div>