package com.example.inbloc_app.Fragments;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.navigation.NavController;
import androidx.navigation.Navigation;
import androidx.navigation.fragment.NavHostFragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.inbloc_app.R;
import com.example.inbloc_app.adapter.GymsAdapter;
import com.example.inbloc_app.retrofit.models.Gyms;
import com.example.inbloc_app.retrofit.remote.ApiService;
import com.example.inbloc_app.retrofit.remote.ApiUtils;

import java.util.List;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MyGymsFragment extends Fragment{

    private static final String TAG = "";
    private RecyclerView recyclerView;
    private GymsAdapter gymsAdapter;
    private ApiService apiService;
    private List<Gyms> gymsList;

    private String name[], loc[];
    private int images[] = {R.drawable.logo_felsmeister, R.drawable.logo_blocbuster, R.drawable.logo_zenit, R.drawable.logo_beta};

    public MyGymsFragment() {
        // Required empty public constructor
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {

        View view = inflater.inflate(R.layout.fragment_my_gyms, container, false);
        recyclerView = view.findViewById(R.id.recView_myGyms);


        name = getResources().getStringArray(R.array.gyms_array);
        loc = getResources().getStringArray(R.array.location_array);

        GymsAdapter adapter = new GymsAdapter(getContext(), name, loc, images);
        LinearLayoutManager layoutManager = new LinearLayoutManager(getContext());
        recyclerView.setLayoutManager(layoutManager);
        recyclerView.setAdapter(adapter);



        Button goToGymBtn = (Button) view.findViewById(R.id.goToFragment2);
        goToGymBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Navigation.findNavController(view).navigate(R.id.action_myGyms_to_gymFragment);
            }
        });

        return view;
    }
}
