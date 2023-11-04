# DeConstruct 3
A decompilation of Construct 3 made for Mosa Lina written in nodejs and cpp
---

### What?

The program reads the data.json stored in many Construct games and interpets them using some info from c3runtime.js. Curently this project is as much of a decomp and more of an reinterpeter to make the dry json easier to read, but eventually we will be able to reconstruct the source files. 

See the reinterpeter as the **guide** to modding a game.

### How?

Heres a step by step on how to decomp the steam version of Mosa Lina.

0. Prequsites

- An unziping tool like 7zip installed
- Node installed
- A baseline understanding of programming

1. Getting the files
Go to the game in your library on Steam, click the gear icon -> Manage -> Browse local files

You can then open package.nw as a .zip file and copy the files out of there.

2. Extracting info

Make an out/ directory wherever you cloned this repo, and copy the data.json and c3runtime.js files into the directory.

Then just run `node . extract`


### Agenda

- Do lacing
- Anotate more actions and conditions 
- Mod loading
