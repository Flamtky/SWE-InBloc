package com.example.inbloc_app.retrofit.remote;

public class ApiUtils {

    private ApiUtils(){}

    public static final String BASE_URL = "http://localhost:1337/";

    public static ApiService getApiService(){

        return RetrofitClient.getClient(BASE_URL).create(ApiService.class);

    }

}
