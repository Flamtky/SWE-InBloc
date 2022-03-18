import { writable } from 'svelte/store';
import { browser } from '$app/env';

let storage = "";
if(browser) {
    storage=localStorage.getItem("local_user_data")
}

export const loggedin_user = writable(null);
export const local_user_data = writable( storage);


local_user_data.subscribe(val => browser && localStorage.setItem("local_user_data", val));