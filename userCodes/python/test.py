import sys
import os
import subprocess
import resource

# function to initialise system reources
def initialize_quota():
    global cpu_time, mem
    cpu_time = 2  # quota['time']
    mem = 1000000  # quota['mem']

def setlimits():
    resource.setrlimit(resource.RLIMIT_CPU, (cpu_time, cpu_time))
    #resource.setrlimit(resource.RLIMIT_AS, (100, 100))

#Take user code and add seccomp to it

userFileLocation = sys.argv[1]  # "/home/nikhil/C++"  # sys.argv[1]
f = open(userFileLocation+"/1.cpp", "r")
content = f.read()
#Specify path of seccomp properly
content = "#include" + '"' + "/home/nikhil/Quizapp/quizappserver/userCodes/seccomp/myseccomp.h" + '"'+ '\n' + content

split_data = content.split('main')
before_main = split_data[0] + 'main'
after_main = split_data[1]

ind = after_main.find('{')+1
code = before_main + after_main[:ind] + \
    'install_filters();\n' + after_main[ind:]

with open(userFileLocation + '/temp.cpp', 'w+') as fp:
    fp.write(code)

# prepare code to run

codetorun = userFileLocation + '/temp.cpp'
exe =  userFileLocation + '/exe'
#print(codetorun)
compile_code = os.system(
    "g++ -o" +exe +" "+  codetorun+" "+ "-lseccomp -lm")



# prepare input output pipes to run process
opf = open(userFileLocation + "/o.txt", "w+")
errf = open(userFileLocation + "/e.txt", "w+")
exec_path = userFileLocation + "/exe"

initialize_quota()
qid  = sys.argv[2]
qcnt = sys.argv[3]


#status codes of all the outputs
data=''

for x in range(int(qcnt)):
    
    input_path = "/home/nikhil/Quizapp/quizappserver/questions/"+qid +"/t{}.txt".format(x+1)
    output_path = userFileLocation + "/o{}.txt".format(x+1)
    error_path = userFileLocation + "/e{}.txt".format(x+1)
        
    opf =open( output_path,"w+")
    ipf = open(input_path,"r")
    errf = open(error_path,"w+")
    rc = compile_code
    if compile_code==0:
        child = subprocess.Popen(
    [exec_path], preexec_fn=setlimits, stdin=ipf, stdout=opf, stderr=errf, shell=True
    )
        child.wait()
        rc = child.returncode  
        print(rc)

   # print(data)
    opf.close()
    errf.close()
    ipf.close()


        
    




