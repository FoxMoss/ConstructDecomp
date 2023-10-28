#include "json11.hpp"
#include "raylib.h"
#include <cstdio>
#include <fstream>
#include <iostream>
#include <nlohmann/json.hpp>
#include <string>
#include <vector>

int layout = 113;

int main(void) {
  std::fstream file("../out.json");
  auto json = nlohmann::json::parse(file);

  const int screenWidth = json["game"]["width"];
  const int screenHeight = json["game"]["height"];

  int offsetX = 0;
  int offsetY = 0;

  InitWindow(screenWidth, screenHeight, "Construct Preview");

  SetTargetFPS(60);
  while (!WindowShouldClose()) {

    BeginDrawing();

    ClearBackground(GRAY);

    if (IsKeyPressed(KEY_B)) {
      layout--;
      std::cout << json["layoutList"][layout] << "\n";
    }

    if (IsKeyPressed(KEY_A)) {
      layout++;
      std::cout << json["layoutList"][layout] << ": " << layout << "\n";
    }

    if (IsKeyPressed(KEY_DOWN)) {
      offsetY -= 100;
    }
    if (IsKeyPressed(KEY_LEFT)) {
      offsetX += 100;
    }
    if (IsKeyPressed(KEY_RIGHT)) {
      offsetX -= 100;
    }
    if (IsKeyPressed(KEY_UP)) {
      offsetY += 100;
    }

    for (auto layer : json["layouts"][layout]) {
      for (auto object : layer) {
        DrawRectangleRec({offsetX + object["x"].template get<int>() -
                              object["width"].template get<int>() / 2,
                          offsetY + object["y"].template get<int>() -
                              object["height"].template get<int>() / 2,
                          object["width"], object["height"]},
                         {0, 0, 255, 100});
        DrawText((std::to_string(object["x"].template get<int>()) + " : " +
                  std::to_string(object["y"].template get<int>()) +
                  object["name"].template get<std::string>())
                     .c_str(),
                 offsetX + object["x"].template get<int>(),
                 offsetY + object["y"].template get<int>(), 10, WHITE);
      }
    }

    EndDrawing();
  }

  CloseWindow();
  return 0;
}
