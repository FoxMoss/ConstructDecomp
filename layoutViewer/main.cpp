#include "json11.hpp"
#include "raylib.h"
#include <cstdio>
#include <fstream>
#include <iostream>
#include <nlohmann/json.hpp>
#include <string>
#include <vector>

int layout = 113;

#define INT .template get<int>()

bool InRect(Vector2 pos, Rectangle rect) {
  if (!(rect.x <= pos.x && pos.x <= rect.x + rect.width))
    return false;
  if (!(rect.y <= pos.y && pos.y <= rect.y + rect.height))
    return false;
  return true;
}

int main(void) {
  std::fstream file("../out/out.json");
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

    bool mousePotential = true;

    Vector2 mousPos = GetMousePosition();

    for (auto &layer : json["layouts"][layout]["layers"]) {
      for (auto &object : layer["objects"]) {
        Rectangle rect = {offsetX + object["x"].template get<int>() -
                              object["width"].template get<int>() / 2,
                          offsetY + object["y"].template get<int>() -
                              object["height"].template get<int>() / 2,
                          object["width"], object["height"]};
        if (mousePotential && InRect(mousPos, rect)) {
          mousePotential = false;
          DrawRectangleRec(rect, {255, 0, 0, 200});
          if (IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {

            object["x"] = object["x"] INT + GetMouseDelta().x;
            object["y"] = object["y"] INT + GetMouseDelta().y;
          }
        } else {
          DrawRectangleRec(rect, {0, 0, 255, 100});
        }
        DrawText((std::to_string(object["x"].template get<int>()) + " : " +
                  std::to_string(object["y"].template get<int>()) +
                  object["name"].template get<std::string>())
                     .c_str(),
                 offsetX + object["x"].template get<int>(),
                 offsetY + object["y"].template get<int>(), 10, WHITE);
      }
    }

    if (IsKeyPressed(KEY_S)) {

      std::ofstream outFile("../out/edit.json");
      outFile.write(json.dump().c_str(), json.dump().size());
    }

    EndDrawing();
  }

  CloseWindow();
  return 0;
}
