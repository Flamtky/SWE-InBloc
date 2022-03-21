package com.example.inbloc_app.retrofit.remote;

public class ApiUtils {

    private ApiUtils(){}

    public static final String BASE_URL = "https://flamtkzx.flamtky.dev/";

    public static ApiService getApiService(){

        return RetrofitClient.getClient(BASE_URL).create(ApiService.class);

    }

}
