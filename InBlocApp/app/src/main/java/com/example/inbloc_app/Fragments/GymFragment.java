package com.example.inbloc_app.Fragments;

import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.fragment.app.Fragment;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.ImageView;
import android.widget.ListView;
import android.widget.TextView;

import com.example.inbloc_app.Gym;
import com.example.inbloc_app.R;
import com.example.inbloc_app.adapter.GymsAdapter;

import java.util.ArrayList;


public class GymFragment extends Fragment {

    private ListView listView;
    private ImageView logo;
    private TextView name;
    private TextView descr;
    private ImageView gymLayout;
    GymsAdapter gymsAdapter;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        View view = inflater.inflate(R.layout.fragment_gym, container, false);

        listView = view.findViewById(R.id.listview_gym);
        logo = view.findViewById(R.id.gym_logo);
        name = view.findViewById(R.id.gym_name);
        descr = view.findViewById(R.id.gym_description);
        gymLayout = view.findViewById(R.id.gym_layout);

        ArrayList<String> walls = new ArrayList<>();
        walls.add("Wall 1");
        walls.add("Wall 2");
        walls.add("Wall 3");
        walls.add("Wall 4");
        walls.add("Wall 5");
        walls.add("Wall 6");
        walls.add("Roof");
        
        name.setText("Felsmeister");
        descr.setText("Bad Oeynhausen");
        logo.setImageResource(R.drawable.logo_felsmeister);
        gymLayout.setImageResource(R.drawable.felsmeister_layout);

        ArrayAdapter arrayAdapter = new ArrayAdapter(getContext(), android.R.layout.simple_list_item_1, walls);
        listView.setAdapter(arrayAdapter);

//        logo.setImageResource();

        return view;
    }
}