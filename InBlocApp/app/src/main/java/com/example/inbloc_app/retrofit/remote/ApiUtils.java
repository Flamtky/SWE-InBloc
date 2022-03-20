package com.example.inbloc_app.retrofit.remote;

public class ApiUtils {

    private ApiUtils(){}

    public static final String BASE_URL = "http://10.0.2.2:8000/";

    public static ApiService getApiService(){

        return RetrofitClient.getClient(BASE_URL).create(ApiService.class);

    }

}
