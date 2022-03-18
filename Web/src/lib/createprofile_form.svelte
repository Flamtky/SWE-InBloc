<script>
    import '$lib/firebase.js';
    import {goto} from '$app/navigation';
	import {
		getAuth,
		signInWithEmailAndPassword,
		signOut,
		sendEmailVerification
	} from 'firebase/auth';
	import { loggedin_user, local_user_data } from '$lib/stores.js';
	import { browser } from '$app/env';
	let errorMessage = '';
	let username = '';
	let zipcode = null;
	let registerBody = {
		email: '',
		username: '',
		zip: null
	};

    async function createProfile() {
		errorMessage = '';
		if (!(username.length >= 3 && username.length <= 16)) {
			errorMessage = 'Username must be 3-16 characters long.';
			return;
		} //TODO Zipcode validation
		let user = getAuth().currentUser;
		let token = await user.getIdToken(/* forceRefresh */ true);
		registerBody.email = user.email;
		registerBody.username = username;
		registerBody.zip = zipcode.toString();
		let res = await fetch(`http://localhost:1337/users/${user.uid}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(registerBody)
		});
		let data = await res.json();
		console.log(data);
		if (res.ok) {
			$loggedin_user = user;
			if (browser) {
				$local_user_data = JSON.stringify(data.data.user);
				window.location.href = '/';
			}
		} else {
			errorMessage = data.error;
		}
	}
    </script>

<section class="login-dark">
    <div class="form">
        <h2 class="">Create Your Profile</h2>
        <div class="illustration"><i class="fa fa-pencil-square-o" /></div>
            <div class="mb-3">
                <input
                    class="form-control"
                    type="text"
                    name="username"
                    placeholder="Username"
                    bind:value={username}
                />
            </div>
            <div class="mb-3">
                <input
                    class="form-control"
                    type="number"
                    name="zipcode"
                    placeholder="Zipcode"
                    bind:value={zipcode}
                />
            </div>
            <div class="mb-3">
                <button class="btn btn-primary d-block w-100" on:click={createProfile}
                    >Create Profile</button
                >
        <p class="text-danger">{errorMessage}</p>
    </div>
</section>

<style>
	.login-dark {
		height: 1000px;
		background: #475d62 url(../../assets/img/star-sky.jpg);
		background-size: cover;
		position: relative;
	}

	.form {
		max-width: 320px;
		width: 90%;
		background-color: #1e2833;
		padding: 40px;
		border-radius: 4px;
		transform: translate(-50%, -50%);
		position: absolute;
		top: 50%;
		left: 50%;
		color: #fff;
		box-shadow: 3px 3px 4px rgba(0, 0, 0, 0.2);
	}

	.login-dark .illustration {
		text-align: center;
		padding: 15px 0 20px;
		font-size: 100px;
		color: #2980ef;
	}

	.login-dark form .form-control {
		background: none;
		border: none;
		border-bottom: 1px solid #434a52;
		border-radius: 0;
		box-shadow: none;
		outline: none;
		color: inherit;
	}

	.login-dark form .btn-primary {
		background: #214a80;
		border: none;
		border-radius: 4px;
		padding: 11px;
		box-shadow: none;
		margin-top: 26px;
		text-shadow: none;
		outline: none;
	}

	.login-dark form .btn-primary:hover,
	.login-dark form .btn-primary:active {
		background: #214a80;
		outline: none;
	}

	.login-dark form .forgot {
		display: block;
		text-align: center;
		font-size: 12px;
		color: #6f7a85;
		opacity: 0.9;
		text-decoration: none;
	}

	.login-dark form .forgot:hover,
	.login-dark form .forgot:active {
		opacity: 1;
		text-decoration: none;
	}

	.login-dark form .btn-primary:active {
		transform: translateY(1px);
	}
</style>