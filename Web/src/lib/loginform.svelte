<script>
	import '../lib/firebase.js';
	import {
		getAuth,
		signInWithEmailAndPassword,
		signOut,
		sendEmailVerification
	} from 'firebase/auth';
	import { loggedin_user, local_user_data, firstLogin } from '$lib/stores.js';
	import { browser } from '$app/env';
	import {goto} from '$app/navigation';
	let email = '';
	let password = '';
	let errorMessage = '';
	let showLoading = false;
	//Login with firebase
	async function tryLogin() {
		errorMessage = '';
		signInWithEmailAndPassword(getAuth(), email, password)
			.then(async (cred) => {
				if (getAuth().currentUser.emailVerified == false) {
					errorMessage = 'Your account is not verified. Please check your email and try again.';
					await sendEmailVerification(getAuth().currentUser);
					signOut(getAuth())
						.then(function () {
							$loggedin_user = null;
							$local_user_data = null;
							console.log('You got logged out because you are not verified.');
						})
						.catch(function (error) {
							// An error happened.
							console.log(error);
							alert('logout failed');
						});
					return;
				}
				getAuth()
					.currentUser.getIdToken(/* forceRefresh */ true)
					.then((idToken) => {
						// Send token to your backend via HTTPS
						// ...
						fetch(`https://flamtkzx.flamtky.dev/users/${cred.user.uid}`, {
							method: 'GET',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${idToken}`
							}
						})
							.catch(function (error) {
								signOut(getAuth())
									.then(function () {
										// Sign-out successful.
									})
									.catch(function (error) {
										// An error happened.
										alert('logout failed');
									});
								console.log(error);
							})
							.then(async (response) => {
								console.log(response);
								if (!response) {
									console.log('no response');
									errorMessage = 'API error';
									$loggedin_user = null;
									$local_user_data = null;
									return;
								} else if (response.status == 404) {
									errorMessage = 'DB Entrie not found';
									$loggedin_user = null;
									$local_user_data = null;
									$firstLogin = true;
									return;
								} else {
									console.log('response');
									//console.log(await response.json());
									var json = await response.json();
									console.log(json.data.user);
									if (browser) {
										$local_user_data = JSON.stringify(json.data.user);
										showLoading = true;
										goto('/');
									}
								}
							});
					})
					.catch((err) => {
						console.error(err);
					});
			})
			.catch(function (error) {
				errorMessage = error.code;
			});
	}
</script>

<section class="login-dark">
	<div class="form">
		<h2 class="">Login</h2>
		<div class="illustration"><i class="icon ion-ios-locked-outline" /></div>
		<div class="mb-3">
			<input
				class="form-control"
				type="email"
				name="email"
				placeholder="Email"
				bind:value={email}
			/>
		</div>
		<div class="mb-3">
			<input
				class="form-control"
				type="password"
				name="password"
				placeholder="Password"
				bind:value={password}
			/>
		</div>
		<div class="mb-3">
			{#if showLoading}
				<button class="btn btn-primary d-block w-100">Logging in...</button>
			{:else}
				<button class="btn btn-primary d-block w-100" on:click={tryLogin}>Log In</button>
			{/if}
		</div>

		<a class="forgot" href="/forgotpassword">Forgot your password?</a>
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
