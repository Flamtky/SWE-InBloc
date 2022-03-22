package com.example.inbloc_app.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.inbloc_app.R;
import com.example.inbloc_app.retrofit.models.Gyms;

import java.util.ArrayList;
import java.util.List;

public class GymsAdapter extends RecyclerView.Adapter<GymsAdapter.ViewHolder> {

    private Context context;
    private List<Gyms> showGyms = new ArrayList<>();
    public String passGymID;

    public GymsAdapter() {
        super();
    }

    public GymsAdapter(Context context, List<Gyms> showGyms){

        this.context = context;
        this.showGyms = showGyms;

    }

    public static class ViewHolder extends RecyclerView.ViewHolder {

        public TextView gymName;
        public TextView gymDescription;
        public Button favorite;
        public ImageView logo;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            gymName = itemView.findViewById(R.id.gymslist_gymName);
            gymDescription = itemView.findViewById(R.id.gymslist_description);
            favorite = itemView.findViewById(R.id.gymslist_favorite);
            logo = itemView.findViewById(R.id.gymslist_logo);
        }
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        context = parent.getContext();
        return new GymsAdapter.ViewHolder(LayoutInflater.from(context)
        .inflate(R.layout.list_row_gym,parent,false));
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        Gyms gyms = showGyms.get(position);
        String gymName = gyms.getName();
        String description = gyms.getDescription();

        holder.gymName.setText(gymName);
        holder.gymDescription.setText(description);

    }

    @Override
    public int getItemCount() {
        return showGyms.size();
    }

    public void setData(List<Gyms> showGyms){
        this.showGyms = showGyms;
        notifyDataSetChanged();
    }

}
